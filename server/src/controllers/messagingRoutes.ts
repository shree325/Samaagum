import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';
import { DEFAULT_CHAT_SETTINGS } from '../settings-library/settingsSeeder';
import { conversationReadService } from '../services/ConversationReadService';

// Helper to get active chat settings
async function getChatSettings() {
  const row = await prisma.platform_settings.findFirst({
    where: { scope_tenant_id: null, key: 'chat_settings' }
  });
  if (row && row.value) {
    return { ...DEFAULT_CHAT_SETTINGS, ...(row.value as any) };
  }
  return DEFAULT_CHAT_SETTINGS;
}

// Helper to get user role keys
async function getUserRoles(userId: string): Promise<string[]> {
  const roles = await prisma.$queryRawUnsafe<{ key: string }[]>(
    `SELECT r.key FROM role_assignments ra
     JOIN roles r ON r.id = ra.role_id
     WHERE ra.user_id = $1::uuid
       AND (ra.expires_at IS NULL OR ra.expires_at > now())`,
    userId
  );
  const roleKeys = roles.map(r => r.key);
  if (roleKeys.length === 0) {
    roleKeys.push('registered_user'); // default fallback
  }
  return roleKeys;
}

// Helper to check if two users share a common group or event
async function shareCommonGroupOrEvent(user1: string, user2: string): Promise<boolean> {
  const user2Groups = await prisma.group_memberships.findMany({
    where: { user_id: user2, state: 'active' },
    select: { group_id: true }
  });
  const user2GroupIds = user2Groups.map(g => g.group_id);

  if (user2GroupIds.length > 0) {
    const commonGroup = await prisma.group_memberships.findFirst({
      where: {
        user_id: user1,
        state: 'active',
        group_id: { in: user2GroupIds }
      }
    });
    if (commonGroup) return true;
  }

  const user2Events = await prisma.attendees.findMany({
    where: { user_id: user2 },
    select: { bookings: { select: { event_id: true } } }
  });
  const user2EventIds = user2Events.map(a => a.bookings.event_id).filter(Boolean);

  if (user2EventIds.length > 0) {
    const commonEvent = await prisma.attendees.findFirst({
      where: {
        user_id: user1,
        bookings: {
          event_id: { in: user2EventIds }
        }
      }
    });
    if (commonEvent) return true;
  }

  return false;
}

export async function messagingRoutes(fastify: FastifyInstance) {
  // GET /api/messaging/settings
  fastify.get('/settings', async (request, reply) => {
    try {
      const settings = await getChatSettings();
      return reply.send({ success: true, data: settings });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // GET /api/messaging/conversations
  fastify.get('/conversations', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    
    try {
      const participants = await prisma.conversation_participants.findMany({
        where: { user_id: userId }
      });
      const conversationIds = participants.map(p => p.conversation_id);
      
      const conversations = await prisma.conversations.findMany({
        where: { id: { in: conversationIds } },
        include: {
          conversation_participants: {
            select: {
              user_id: true,
              role: true,
              users: {
                select: {
                  primary_email: true,
                  profiles: {
                    select: { display_name: true, messaging_restriction: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { updated_at: "desc" }
      });

      const mapped = await Promise.all(conversations.map(async c => {
        const unreadCount = await prisma.messages.count({
          where: {
            conversation_id: c.id,
            sender_user_id: { not: userId },
            is_deleted: false,
            OR: [
              { message_receipts: { none: { user_id: userId } } },
              { message_receipts: { some: { user_id: userId, seen_at: null } } }
            ]
          }
        });

        const lastMsg = await prisma.messages.findFirst({
          where: { conversation_id: c.id, is_deleted: false },
          orderBy: { created_at: 'desc' }
        });

        return {
          id: c.id,
          type: c.type === "dm" ? "DIRECT" : "GROUP",
          title: c.title || null,
          createdById: c.created_by,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          preview: lastMsg?.body || null,
          unread: unreadCount,
          participants: c.conversation_participants.map(p => ({
            userId: p.user_id,
            role: p.role,
            name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User",
            messagingRestriction: p.users?.profiles?.messaging_restriction || "anyone"
          }))
        };
      }));

      return reply.send({ success: true, data: mapped });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // GET /api/messaging/users/search
  fastify.get('/users/search', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    
    try {
      const { q } = request.query as any;
      if (!q) {
        return reply.send({ success: true, data: [] });
      }
      
      const users = await prisma.users.findMany({
        where: {
          id: { not: userId }, // Exclude self
          profiles: {
            display_name: { contains: q, mode: 'insensitive' }
          }
        },
        include: {
          profiles: {
            select: {
              display_name: true
            }
          }
        },
        take: 20
      });
      
      const results = users.map(u => ({
        id: u.id,
        name: u.profiles?.display_name || null
      }));

      return reply.send({ success: true, data: results });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/conversations/direct
  fastify.post('/conversations/direct', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const creatorId = request.user?.id;
    if (!creatorId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    
    try {
      const settings = await getChatSettings();
      if (settings.allowSiteMessaging === false) {
        return reply.status(400).send({ success: false, error: "Messaging is disabled globally by the administrator" });
      }

      const { targetId } = request.body as any;
      if (!targetId) {
        return reply.status(400).send({ success: false, error: "targetId is required" });
      }

      // Check target's messaging restriction policy
      const targetProfile = await prisma.profiles.findUnique({
        where: { user_id: targetId }
      });
      let restriction = targetProfile?.messaging_restriction || 'anyone';
      // Treat legacy approval_required as only_connected (connection is now the gate)
      if (restriction === 'approval_required') restriction = 'only_connected';

      if (restriction === 'no_one') {
        // User has disabled all incoming DMs
        return reply.status(403).send({
          success: false,
          error: "This user has disabled direct messages.",
          restriction: "no_one"
        });
      }

      if (restriction === 'only_connected') {
        const connected = await prisma.connections.findFirst({
          where: {
            state: 'accepted' as any,
            OR: [
              { requester_user_id: creatorId, addressee_user_id: targetId },
              { requester_user_id: targetId, addressee_user_id: creatorId }
            ]
          }
        });
        if (!connected) {
          return reply.status(403).send({
            success: false,
            error: "Messaging restricted to connected users only.",
            restriction: "only_connected"
          });
        }
      }

      if (!settings.allowDirectMessaging) {
        const isGroupEnabled = settings.allowGroupChat;
        const isEventEnabled = settings.allowEventChat;
        if (isGroupEnabled || isEventEnabled) {
          const shareCommon = await shareCommonGroupOrEvent(creatorId, targetId);
          if (!shareCommon) {
            return reply.status(400).send({ success: false, error: "Direct messaging is disabled by the administrator. You can only message users you share a common group or event with." });
          }
        } else {
          return reply.status(400).send({ success: false, error: "Direct messaging is disabled by the administrator" });
        }
      }

      const creatorRoles = await getUserRoles(creatorId);
      const allowedRoles = settings.rolePermissions?.directMessaging || [];
      const isAllowed = creatorRoles.some(r => allowedRoles.includes(r));
      if (!isAllowed) {
        return reply.status(403).send({ success: false, error: "Your role does not have permission to initiate direct messages" });
      }

      // Check if a DM already exists
      const existing = await prisma.conversations.findFirst({
        where: {
          type: "dm" as any,
          AND: [
            { conversation_participants: { some: { user_id: creatorId } } },
            { conversation_participants: { some: { user_id: targetId } } }
          ]
        },
        include: {
          conversation_participants: {
            select: {
              user_id: true,
              role: true,
              users: {
                select: {
                  primary_email: true,
                  profiles: {
                    select: { display_name: true, messaging_restriction: true }
                  }
                }
              }
            }
          }
        }
      });

      if (existing) {
        return reply.send({
          success: true,
          data: {
            id: existing.id,
            type: "DIRECT",
            title: null,
            createdById: existing.created_by,
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
            participants: existing.conversation_participants.map((p: any) => ({
              userId: p.user_id,
              role: p.role,
              name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User",
              messagingRestriction: p.users?.profiles?.messaging_restriction || "anyone"
            }))
          }
        });
      }

      // Otherwise create a new direct conversation
      const conversation = await prisma.conversations.create({
        data: {
          tenant_id: "00000000-0000-0000-0000-000000000000",
          type: "dm" as any,
          created_by: creatorId,
          conversation_participants: {
            createMany: {
              data: [
                { user_id: creatorId, role: "member" },
                { user_id: targetId, role: "member" }
              ]
            }
          }
        },
        include: {
          conversation_participants: {
            select: {
              user_id: true,
              role: true,
              users: {
                select: {
                  primary_email: true,
                  profiles: {
                    select: { display_name: true, messaging_restriction: true }
                  }
                }
              }
            }
          }
        }
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: conversation.id,
          type: "DIRECT",
          title: null,
          createdById: conversation.created_by,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          participants: conversation.conversation_participants.map((p: any) => ({
            userId: p.user_id,
            role: p.role,
            name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User",
            messagingRestriction: p.users?.profiles?.messaging_restriction || "anyone"
          }))
        }
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  // GET /api/messaging/conversations/:id/messages
  fastify.get<{ Params: { id: string }, Querystring: { limit?: number } }>('/conversations/:id/messages', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    
    try {
      const messages = await prisma.messages.findMany({
        where: { 
          conversation_id: request.params.id,
          is_deleted: false
        },
        include: {
          message_receipts: true,
          messages: {
            select: {
              id: true,
              body: true,
              sender_user_id: true,
              users: {
                select: {
                  profiles: {
                    select: { display_name: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { created_at: "desc" },
        take: Number(request.query.limit) || 50
      });

      const mapped = messages.map(m => {
        const receipts = m.message_receipts || [];
        let status = 0;
        const otherReceipts = receipts.filter(r => r.user_id !== m.sender_user_id);
        if (otherReceipts.length > 0) {
          const hasSeen = otherReceipts.some(r => r.seen_at !== null);
          const hasDelivered = otherReceipts.some(r => r.delivered_at !== null);
          if (hasSeen) {
            status = 2;
          } else if (hasDelivered) {
            status = 1;
          }
        }

        return {
          id: m.id,
          messageId: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_user_id,
          content: m.body,
          body: m.body,
          isEdited: m.is_edited,
          createdAt: m.created_at,
          status,
          replyToMessageId: m.reply_to_message_id,
          replyTo: m.messages ? {
            id: m.messages.id,
            body: m.messages.body,
            senderId: m.messages.sender_user_id,
            senderName: m.messages.users?.profiles?.display_name || "User"
          } : null,
          receipts: receipts.map(r => ({
            userId: r.user_id,
            deliveredAt: r.delivered_at,
            seenAt: r.seen_at
          }))
        };
      }).reverse();

      return reply.send({ success: true, data: mapped });
    } catch (err: any) {
      return reply.status(403).send({ success: false, message: err.message });
    }
  });

  // GET /api/messaging/requests/incoming
  fastify.get('/requests/incoming', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      const reqs = await prisma.messaging_requests.findMany({
        where: { receiver_id: userId, status: 'PENDING' },
        include: {
          sender: {
            select: {
              id: true,
              primary_email: true,
              profiles: {
                select: {
                  display_name: true,
                  headline: true
                }
              }
            }
          }
        }
      });
      return reply.send({ success: true, data: reqs });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/requests
  fastify.post('/requests', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    const { targetId } = request.body as any;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    if (!targetId) {
      return reply.status(400).send({ success: false, error: 'targetId is required' });
    }
    try {
      const req = await prisma.messaging_requests.upsert({
        where: {
          sender_id_receiver_id: {
            sender_id: userId,
            receiver_id: targetId
          }
        },
        create: {
          sender_id: userId,
          receiver_id: targetId,
          status: 'PENDING'
        },
        update: {
          status: 'PENDING',
          updated_at: new Date()
        }
      });

      // Query complete request with sender profiles info for real-time notification/render
      const reqWithSender = await prisma.messaging_requests.findUnique({
        where: { id: req.id },
        include: {
          sender: {
            select: {
              id: true,
              primary_email: true,
              profiles: {
                select: {
                  display_name: true,
                  headline: true
                }
              }
            }
          }
        }
      });

      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        chatNamespace.to(`user:${targetId}`).emit("request.received", reqWithSender);
      }

      return reply.status(201).send({ success: true, data: req });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/requests/:id/accept
  fastify.post<{ Params: { id: string } }>('/requests/:id/accept', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      const req = await prisma.messaging_requests.findUnique({
        where: { id: request.params.id }
      });
      if (!req || req.receiver_id !== userId) {
        return reply.status(404).send({ success: false, message: 'Request not found' });
      }

      await prisma.messaging_requests.update({
        where: { id: req.id },
        data: { status: 'ACCEPTED', updated_at: new Date() }
      });

      // Create conversation automatically
      await prisma.conversations.upsert({
        where: {
          dm_key: [req.sender_id, req.receiver_id].sort().join(':')
        },
        create: {
          tenant_id: "00000000-0000-0000-0000-000000000000",
          type: "dm" as any,
          dm_key: [req.sender_id, req.receiver_id].sort().join(':'),
          created_by: req.sender_id,
          conversation_participants: {
            createMany: {
              data: [
                { user_id: req.sender_id, role: "member" },
                { user_id: req.receiver_id, role: "member" }
              ]
            }
          }
        },
        update: {}
      });

      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        const eventPayload = { requestId: req.id, senderId: req.sender_id, receiverId: req.receiver_id };
        chatNamespace.to(`user:${req.sender_id}`).emit("request.accepted", eventPayload);
        chatNamespace.to(`user:${req.receiver_id}`).emit("request.accepted", eventPayload);
      }

      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/requests/:id/decline
  fastify.post<{ Params: { id: string } }>('/requests/:id/decline', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      const req = await prisma.messaging_requests.findUnique({
        where: { id: request.params.id }
      });
      if (!req || req.receiver_id !== userId) {
        return reply.status(404).send({ success: false, message: 'Request not found' });
      }

      await prisma.messaging_requests.update({
        where: { id: req.id },
        data: { status: 'DECLINED', updated_at: new Date() }
      });

      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        const eventPayload = { requestId: req.id, senderId: req.sender_id, receiverId: req.receiver_id };
        chatNamespace.to(`user:${req.sender_id}`).emit("request.declined", eventPayload);
        chatNamespace.to(`user:${req.receiver_id}`).emit("request.declined", eventPayload);
      }

      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // GET /api/messaging/requests/status/:targetId
  fastify.get<{ Params: { targetId: string } }>('/requests/status/:targetId', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      const req = await prisma.messaging_requests.findFirst({
        where: {
          OR: [
            { sender_id: userId, receiver_id: request.params.targetId },
            { sender_id: request.params.targetId, receiver_id: userId }
          ]
        }
      });
      return reply.send({ success: true, data: req });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // GET /api/messaging/counts
  fastify.get('/counts', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      const participations = await prisma.conversation_participants.findMany({
        where: { user_id: userId },
        select: { conversation_id: true }
      });
      const conversationIds = participations.map(p => p.conversation_id);

      const unreadMessages = await prisma.messages.findMany({
        where: {
          conversation_id: { in: conversationIds },
          sender_user_id: { not: userId },
          is_deleted: false,
          OR: [
            { message_receipts: { none: { user_id: userId } } },
            { message_receipts: { some: { user_id: userId, seen_at: null } } }
          ]
        },
        select: { sender_user_id: true }
      });

      const uniqueSenders = new Set(unreadMessages.map(m => m.sender_user_id));
      
      const pendingConnRequests = await prisma.connections.count({
        where: { addressee_user_id: userId, state: 'requested' }
      });

      const unreadNotifLogs = await prisma.notification_log.count({
        where: { user_id: userId, status: { not: 'read' } }
      });

      return reply.send({
        success: true,
        data: {
          messages: uniqueSenders.size,
          notifs: pendingConnRequests + unreadNotifLogs
        }
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/conversations/:id/pin
  fastify.post<{ Params: { id: string } }>('/conversations/:id/pin', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    return reply.send({ success: true });
  });

  // POST /api/messaging/conversations/:id/unpin
  fastify.post<{ Params: { id: string } }>('/conversations/:id/unpin', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    return reply.send({ success: true });
  });

  // POST /api/messaging/conversations/:id/archive
  fastify.post<{ Params: { id: string } }>('/conversations/:id/archive', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    return reply.send({ success: true });
  });

  // POST /api/messaging/conversations/:id/unarchive
  fastify.post<{ Params: { id: string } }>('/conversations/:id/unarchive', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    return reply.send({ success: true });
  });

  // POST /api/messaging/users/:id/block
  fastify.post<{ Params: { id: string } }>('/users/:id/block', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    return reply.send({ success: true });
  });

  // POST /api/messaging/users/:id/unblock
  fastify.post<{ Params: { id: string } }>('/users/:id/unblock', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    return reply.send({ success: true });
  });

  // GET /api/messaging/notifications
  fastify.get('/notifications', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      const logs = await prisma.notification_log.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50
      });

      const msgIds = logs
        .filter(l => l.template_key === 'message_received' && l.provider_ref)
        .map(l => l.provider_ref) as string[];

      const messages = msgIds.length > 0 ? await prisma.messages.findMany({
        where: { id: { in: msgIds } },
        include: {
          users: {
            select: {
              primary_email: true,
              profiles: {
                select: { display_name: true }
              }
            }
          }
        }
      }) : [];
      const messageMap = new Map(messages.map(m => [m.id, m]));

      const acceptorUserIds = logs
        .filter(l => l.template_key === 'connection_accepted' && l.provider_ref)
        .map(l => l.provider_ref) as string[];

      const acceptors = acceptorUserIds.length > 0 ? await prisma.users.findMany({
        where: { id: { in: acceptorUserIds } },
        include: {
          profiles: {
            select: { display_name: true }
          }
        }
      }) : [];
      const acceptorMap = new Map(acceptors.map(u => [u.id, u]));

      // Pre-fetch forum posts to resolve groupId asynchronously
      const postIds = logs
        .filter(l => (l.template_key === 'group_new_post' || l.template_key === 'group_post_activity') && l.provider_ref)
        .map(l => l.provider_ref) as string[];

      const forumPosts = postIds.length > 0 ? await prisma.forum_posts.findMany({
        where: { id: { in: postIds } },
        select: { id: true, scope_id: true }
      }) : [];
      const forumPostsMap = new Map<string, string>(forumPosts.map((fp: any) => [fp.id, fp.scope_id]));

      const mappedLogs = logs.map(l => {
        const time = new Date(l.created_at);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dayLabel = time.toDateString() === new Date().toDateString() ? "Today" : time.toLocaleDateString([], { month: 'short', day: 'numeric' });

        if (l.template_key === 'message_received' && l.provider_ref) {
          const msg = messageMap.get(l.provider_ref);
          if (msg) {
            const senderName = msg.users?.profiles?.display_name || msg.users?.primary_email?.split('@')[0] || "Someone";
            return {
              id: l.id,
              type: "message",
              who: senderName,
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `<b>${senderName}</b> sent you a message: “${msg.body}”`,
              action: "reply"
            };
          }
        }

        if (l.template_key === 'connection_accepted' && l.provider_ref) {
          const u = acceptorMap.get(l.provider_ref);
          if (u) {
            const acceptorName = u.profiles?.display_name || u.primary_email?.split('@')[0] || "Someone";
            return {
              id: l.id,
              who: acceptorName,
              type: "connect",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `<b>${acceptorName}</b> accepted your connection request! 🎉`,
              action: "view"
            };
          }
        }

        if (l.template_key === 'group_user_joined' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            const joinedUserName = data.joinedUserName || "Someone";
            const groupName = data.groupName || "the group";
            let text = "";
            if (data.approverName) {
              text = `<b>${data.approverName}</b> approved <b>${joinedUserName}</b>'s request to join <b>${groupName}</b>`;
            } else {
              text = `<b>${joinedUserName}</b> has joined the group <b>${groupName}</b>`;
            }
            return {
              id: l.id,
              who: joinedUserName,
              type: "group_user_joined",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text,
              action: "view_user",
              targetUserId: data.joinedUserId
            };
          } catch (e) {
            return {
              id: l.id,
              who: "Someone",
              type: "group_user_joined",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `A new user has joined the group`,
              action: "view_user",
              targetUserId: l.provider_ref
            };
          }
        }

        if (l.template_key === 'group_join_declined' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            const groupName = data.groupName || "the group";
            return {
              id: l.id,
              who: groupName,
              type: "system",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your request to join <b>${groupName}</b> was declined`,
              action: null
            };
          } catch (e) {
            return {
              id: l.id,
              who: "System",
              type: "system",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your request to join the group was declined`,
              action: null
            };
          }
        }

        if (l.template_key === 'group_created') {
          return {
            id: l.id,
            who: "Groups",
            type: "group_created",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text: `A new group was created. Click to view details.`,
            action: "view",
            groupId: l.provider_ref
          };
        }

        if (l.template_key === 'group_new_post') {
          const targetGroupId = l.provider_ref ? (forumPostsMap.get(l.provider_ref) || undefined) : undefined;
          return {
            id: l.id,
            who: "Forums",
            type: "group_new_post",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text: `New post created in a group forum.`,
            action: "view",
            postId: l.provider_ref || undefined,
            groupId: targetGroupId
          };
        }

        if (l.template_key === 'group_post_activity') {
          const targetGroupId = l.provider_ref ? (forumPostsMap.get(l.provider_ref) || undefined) : undefined;
          return {
            id: l.id,
            who: "Forums",
            type: "group_post_activity",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text: `Activity on a forum post you follow.`,
            action: "view",
            postId: l.provider_ref || undefined,
            groupId: targetGroupId
          };
        }

        if (l.template_key === 'group_gallery') {
          return {
            id: l.id,
            who: "Gallery",
            type: "group_gallery",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text: `New gallery media has been uploaded.`,
            action: "view",
            itemId: l.provider_ref
          };
        }

        if (l.template_key === 'subscription_expiring_soon') {
          return {
            id: l.id,
            type: "billing",
            who: "Billing",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text: `Your subscription is expiring in 5 days. Click to renew!`,
            action: "billing"
          };
        }

        return {
          id: l.id,
          type: "system",
          who: "System",
          unread: l.status !== 'read',
          day: dayLabel,
          time: timeStr,
          text: `Notification: ${l.template_key}`,
          action: null
        };
      });

      return reply.send({ success: true, data: mappedLogs });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/notifications/mark-read
  fastify.post('/notifications/mark-read', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      await prisma.notification_log.updateMany({
        where: { user_id: userId, status: { not: 'read' } },
        data: { status: 'read' }
      });
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/notifications/:id/read
  fastify.post<{ Params: { id: string } }>('/notifications/:id/read', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    try {
      await prisma.notification_log.update({
        where: { id: request.params.id, user_id: userId },
        data: { status: 'read' }
      });
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/conversations/:id/read
  fastify.post<{ Params: { id: string } }>(
    '/conversations/:id/read',
    { preHandler: [(fastify as any).authenticate] },
    async (request, reply) => {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, message: 'Unauthorized' });
      }

      const conversationId = request.params.id;

      // Verify the conversation exists and the user is a participant
      const participant = await prisma.conversation_participants.findUnique({
        where: {
          conversation_id_user_id: { conversation_id: conversationId, user_id: userId },
        },
      });
      if (!participant) {
        return reply.status(403).send({ success: false, message: 'Not a participant of this conversation' });
      }

      try {
        const result = await conversationReadService.readConversation(userId, conversationId);

        // Broadcast via Socket.IO so other open tabs / devices update instantly
        const chatNamespace = (fastify as any).io?.of('/chat');
        if (chatNamespace) {
          if (result.receiptUpdates.length > 0) {
            chatNamespace
              .to(`conversation:${conversationId}`)
              .emit('receipt.updated', result.receiptUpdates);
          }

          chatNamespace.to(`user:${userId}`).emit('notification:count', {
            count: result.unreadCount,
          });
          chatNamespace.to(`user:${userId}`).emit('notification:updated', {
            conversationId,
            type:                'message_received',
            notificationsSynced: result.notificationsSynced,
          });
        }

        return reply.send({
          success: true,
          data: {
            messagesMarkedRead:  result.messagesMarkedRead,
            notificationsSynced: result.notificationsSynced,
            unreadCount:         result.unreadCount,
          },
        });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err.message });
      }
    }
  );
}
