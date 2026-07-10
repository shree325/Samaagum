import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';
import { DEFAULT_CHAT_SETTINGS } from '../settings-library/settingsSeeder';
import { conversationReadService } from '../services/ConversationReadService';
import { GroupService } from '../services/GroupService';
import { EventService } from '../services/EventService';
import { EventInvitationService } from '../services/EventInvitationService';
import { sendEmail, generateTicketHtml } from '../utils/email';

// Must exactly match the client-side formula in normalizeJoinedEvent
// (client/src/home-tickets.tsx) that computes the "friendly" ticket id shown to users,
// so a scanner manually typing that on-screen id resolves against this persisted value.
function computeTicketCode(eventTitle: string | null | undefined, ticketId: string): string {
  const eventNameClean = (eventTitle || 'TICKET').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 8);
  const shortNo = ticketId.split('-')[0].toUpperCase();
  return `${eventNameClean}_${shortNo}`;
}

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
                  profile_image_data: true,
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
          participants: c.conversation_participants.map(p => {
            const img = p.users?.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(p.users.profile_image_data).toString('base64')}` : null;
            return {
              userId: p.user_id,
              role: p.role,
              name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User",
              messagingRestriction: p.users?.profiles?.messaging_restriction || "anyone",
              img
            };
          })
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
        select: {
          id: true,
          profile_image_data: true,
          profiles: {
            select: {
              display_name: true
            }
          }
        },
        take: 20
      });
      
      const results = users.map(u => {
        const img = u.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(u.profile_image_data).toString('base64')}` : null;
        return {
          id: u.id,
          name: u.profiles?.display_name || null,
          img
        };
      });

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
                  profile_image_data: true,
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
            participants: existing.conversation_participants.map((p: any) => {
              const img = p.users?.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(p.users.profile_image_data).toString('base64')}` : null;
              return {
                userId: p.user_id,
                role: p.role,
                name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User",
                messagingRestriction: p.users?.profiles?.messaging_restriction || "anyone",
                img
              };
            })
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
                  profile_image_data: true,
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
          participants: conversation.conversation_participants.map((p: any) => {
            const img = p.users?.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(p.users.profile_image_data).toString('base64')}` : null;
            return {
              userId: p.user_id,
              role: p.role,
              name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User",
              messagingRestriction: p.users?.profiles?.messaging_restriction || "anyone",
              img
            };
          })
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
          users: {
            select: {
              profile_image_data: true,
              profiles: {
                select: { display_name: true }
              }
            }
          },
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
          senderName: m.users?.profiles?.display_name || "User",
          senderImg: m.users?.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(m.users.profile_image_data).toString('base64')}` : null,
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

      // Pre-fetch bookings for event join requests
      const eventJoinLogs = logs.filter(l => l.template_key === 'event_join_request' && l.provider_ref);
      const bookingQueries = eventJoinLogs.map(l => {
        try {
          const data = JSON.parse(l.provider_ref || '{}');
          return { eventId: data.eventId, bookerUserId: data.requesterId };
        } catch (e) {
          return null;
        }
      }).filter(Boolean) as { eventId: string, bookerUserId: string }[];

      const bookings = bookingQueries.length > 0 ? await prisma.bookings.findMany({
        where: {
          OR: bookingQueries.map(q => ({
            event_id: q.eventId,
            booker_user_id: q.bookerUserId
          }))
        },
        select: { event_id: true, booker_user_id: true, status: true }
      }) : [];

      const bookingStatusMap = new Map<string, string>();
      for (const b of bookings) {
        bookingStatusMap.set(`${b.event_id}:${b.booker_user_id}`, b.status);
      }

      // Pre-fetch events for event reminders
      const reminderEventIds = logs
        .filter(l => l.template_key.startsWith('event_reminder_') && l.provider_ref)
        .map(l => l.provider_ref) as string[];
      
      const reminderEvents = reminderEventIds.length > 0 ? await prisma.events.findMany({
        where: { id: { in: reminderEventIds } },
        select: { id: true, title: true }
      }) : [];
      const eventReminderMap = new Map<string, string>(reminderEvents.map(e => [e.id, e.title]));

      // Pre-fetch group memberships for group join requests
      const groupJoinLogs = logs.filter(l => l.template_key === 'group_join_request' && l.provider_ref);
      const membershipQueries = groupJoinLogs.map(l => {
        try {
          const data = JSON.parse(l.provider_ref || '{}');
          return { groupId: data.groupId, userId: data.requesterId };
        } catch (e) {
          return null;
        }
      }).filter(Boolean) as { groupId: string, userId: string }[];

      const memberships = membershipQueries.length > 0 ? await prisma.group_memberships.findMany({
        where: {
          OR: membershipQueries.map(q => ({
            group_id: q.groupId,
            user_id: q.userId
          }))
        },
        select: { group_id: true, user_id: true, state: true }
      }) : [];

      const membershipStatusMap = new Map<string, string>();
      for (const m of memberships) {
        membershipStatusMap.set(`${m.group_id}:${m.user_id}`, m.state);
      }

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

        if (l.template_key === 'event_join_request' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            const bStatus = bookingStatusMap.get(`${data.eventId}:${data.requesterId}`);
            let actedVal: string | null = null;
            if (bStatus === 'confirmed') actedVal = 'accepted';
            else if (bStatus === 'cancelled') actedVal = 'declined';

            return {
              id: l.id,
              who: data.requesterName || "A user",
              type: "registration",
              unread: l.status !== 'read',
              acted: actedVal,
              day: dayLabel,
              time: timeStr,
              text: `<b>${data.requesterName}</b> requested to join <b>${data.eventTitle}</b>`,
              action: "event_request",
              eventId: data.eventId,
              eventTitle: data.eventTitle,
              requesterId: data.requesterId,
              answers: data.answers || {},
              questionLabels: data.questionLabels || {}
            };
          } catch (e) {
            return {
              id: l.id,
              who: "Someone",
              type: "registration",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `A user has requested to join your event`,
              action: "event_request"
            };
          }
        }

        if (l.template_key === 'group_join_request' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            const mStatus = membershipStatusMap.get(`${data.groupId}:${data.requesterId}`);
            let actedVal: string | null = null;
            if (mStatus === 'active') actedVal = 'accepted';
            else if (mStatus === 'rejected' || mStatus === 'cancelled') actedVal = 'declined';

            return {
              id: l.id,
              who: data.requesterName || "A user",
              type: "join",
              unread: l.status !== 'read',
              acted: actedVal,
              day: dayLabel,
              time: timeStr,
              text: `<b>${data.requesterName}</b> requested to join <b>${data.groupName}</b>`,
              action: "group_request",
              groupId: data.groupId,
              groupName: data.groupName,
              requesterId: data.requesterId,
              answers: data.answers || {}
            };
          } catch (e) {
            return {
              id: l.id,
              who: "Someone",
              type: "join",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `A user has requested to join your group`,
              action: "group_request"
            };
          }
        }

        if (l.template_key === 'event_request_accepted' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            return {
              id: l.id,
              who: data.eventTitle || "Event",
              type: "event",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your request to join <b>${data.eventTitle}</b> was accepted! 🎉`,
              action: "view_event",
              eventId: data.eventId
            };
          } catch (e) {
            return {
              id: l.id,
              who: "Event",
              type: "event",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your request to join the event was accepted!`,
              action: "view_event"
            };
          }
        }

        if (l.template_key === 'event_request_declined' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            return {
              id: l.id,
              who: data.eventTitle || "Event",
              type: "system",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your request to join <b>${data.eventTitle}</b> was declined`,
              action: null
            };
          } catch (e) {
            return {
              id: l.id,
              who: "Event",
              type: "system",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your request to join the event was declined`,
              action: null
            };
          }
        }

        if (l.template_key === 'registration_opened' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            return {
              id: l.id,
              who: data.eventTitle || "Event",
              type: "registration_opened",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Registration is now OPEN for <b>${data.eventTitle}</b>! Grab your tickets before they run out.`,
              action: "view_event",
              eventId: data.eventId
            };
          } catch (e) {
            return {
              id: l.id,
              who: "Event",
              type: "registration_opened",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Registration is now OPEN for an event in your wishlist!`,
              action: "events" // Fallback
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

        if (l.template_key.startsWith('event_reminder_')) {
          const eventId = l.provider_ref || "";
          const eventTitle = eventId ? (eventReminderMap.get(eventId) || "Your event") : "Your event";
          
          let windowMin = l.template_key.split('_')[2] || '0min';
          let label = windowMin === '60min' ? '1 hour'
            : windowMin === '30min' ? '30 minutes'
            : windowMin === '10min' ? '10 minutes'
            : windowMin === '5min' ? '5 minutes'
            : windowMin === '2min' ? '2 minutes'
            : windowMin === '1min' ? '1 minute'
            : 'now';
            
          let text = label === 'now' 
            ? `🚀 <b>${eventTitle}</b> is starting now!`
            : `⏰ <b>${eventTitle}</b> starts in <b>${label}</b>!`;

          return {
            id: l.id,
            who: eventTitle,
            type: "event",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text,
            action: eventId ? "view_event" : null,
            eventId: eventId || undefined
          };
        }

        if (l.template_key === 'group_event_created' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            return {
              id: l.id,
              who: data.groupName || "Groups",
              type: "group_event_created",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `A new event <b>"${data.eventTitle}"</b> was created in <b>${data.groupName}</b>!`,
              action: "view_event",
              eventId: data.eventId,
              groupId: data.groupId
            };
          } catch (e) {
            return {
              id: l.id,
              who: "Groups",
              type: "group_event_created",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `A new event was created in your group.`,
              action: "view"
            };
          }
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

        if (l.template_key === 'forum_thread_pending') {
          let parsedRef: any = {};
          try { parsedRef = l.provider_ref ? JSON.parse(l.provider_ref) : {}; } catch {}
          const postTitle = parsedRef.postTitle || 'a thread';
          const authorName = parsedRef.authorName || 'Someone';
          const eventTitle = parsedRef.eventTitle || 'event';
          return {
            id: l.id,
            who: "Discussion",
            type: "forum_thread_pending",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text: `<b>${authorName}</b> created thread <b>"${postTitle}"</b> in <b>${eventTitle}</b> — awaiting your approval.`,
            action: "view",
            eventId: parsedRef.eventId,
            postId: parsedRef.postId
          };
        }

        if (l.template_key === 'forum_thread_approved') {
          let parsedRef: any = {};
          try { parsedRef = l.provider_ref ? JSON.parse(l.provider_ref) : {}; } catch {}
          const postTitle = parsedRef.postTitle || 'your thread';
          const approverName = parsedRef.approverName || 'An organizer';
          const eventTitle = parsedRef.eventTitle || 'event';
          return {
            id: l.id,
            who: "Discussion",
            type: "forum_thread_approved",
            unread: l.status !== 'read',
            day: dayLabel,
            time: timeStr,
            text: `<b>${approverName}</b> approved your thread <b>"${postTitle}"</b> in <b>${eventTitle}</b>! 🎉`,
            action: "view",
            eventId: parsedRef.eventId,
            postId: parsedRef.postId
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

        if (l.template_key === 'subscription_activated' && l.provider_ref) {
          try {
            const data = JSON.parse(l.provider_ref);
            const planName = data.planName || "Standard";
            return {
              id: l.id,
              type: "billing",
              who: "Billing",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your subscription to the <b>${planName} Plan</b> has been activated successfully! 🎉`,
              action: "billing"
            };
          } catch (e) {
            return {
              id: l.id,
              type: "billing",
              who: "Billing",
              unread: l.status !== 'read',
              day: dayLabel,
              time: timeStr,
              text: `Your subscription has been activated successfully! 🎉`,
              action: "billing"
            };
          }
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

  // POST /api/messaging/events/:id/request-join
  fastify.post<{ Params: { id: string } }>('/events/:id/request-join', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const eventId = request.params.id;
    try {
      const event = await prisma.events.findUnique({
        where: { id: eventId }
      });
      if (!event) {
        return reply.status(404).send({ success: false, message: 'Event not found' });
      }

      const isHostOrCoHost = await EventService.verifyEventHostOrCoHost(userId, eventId);

      // Check registration status
      const isActuallyOpen = event.registration_status === 'OPEN' || 
        (event.registration_status === 'SCHEDULED' && event.registration_opens_at && new Date() >= event.registration_opens_at);

      if (!isActuallyOpen && !isHostOrCoHost) {
        return reply.status(403).send({ success: false, message: 'Registration is currently closed for this event.' });
      }

      // Check if access is restricted
      const venueObj = (event.venue as any) || {};
      const meta = venueObj.meta || {};
      const isRestricted = meta.joinEligibility === 'restricted';
      const isInviteOnly = meta.joinEligibility === 'invite';
      const approvalRequired = event.approval_required || isRestricted;

      if (isRestricted && !isHostOrCoHost) {
        const allowedGroups: string[] = meta.selectedAccess?.restricted?.groups || [];
        const hasAccess = allowedGroups.length > 0 && await GroupService.userInGroups(userId, allowedGroups);
        if (!hasAccess) {
          return reply.status(403).send({ success: false, message: "You don't have access to join this event." });
        }
      }

      const inviteToken = (request.body as any)?.inviteToken;
      if (isInviteOnly && !isHostOrCoHost) {
        if (!inviteToken) {
          return reply.status(403).send({ success: false, message: 'A valid invite link is required to join this event.' });
        }
        const validation = await EventInvitationService.validateToken(inviteToken, 'join');
        if (!validation.valid || validation.invite?.event_id !== eventId) {
          return reply.status(403).send({ success: false, message: 'A valid invite link is required to join this event.' });
        }
      }

      const user = await prisma.users.findUnique({
        where: { id: userId }
      });
      const requesterEmail = user?.primary_email || '';

      const userProfile = await prisma.profiles.findUnique({
        where: { user_id: userId }
      });
      const requesterName = userProfile?.display_name || 
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 
        (requesterEmail ? requesterEmail.split('@')[0] : 'Guest');

      // Check if already registered or requested
      const existingBooking = await prisma.bookings.findFirst({
        where: {
          event_id: eventId,
          booker_user_id: userId,
          status: { in: ['confirmed', 'pending_approval'] }
        }
      });

      // Check event capacity if this is a new booking request
      let isWaitlisted = false;
      if (!existingBooking && event.capacity_total && event.capacity_total > 0) {
        const activeCount = await prisma.bookings.count({
          where: {
            event_id: eventId,
            status: { in: ['confirmed', 'pending_approval'] }
          }
        });
        if (activeCount >= event.capacity_total) {
          const capacity = (event.settings as any)?.capacity || {};
          if (capacity.waitlist === true) {
            isWaitlisted = true;
          } else {
            return reply.status(400).send({ success: false, message: 'Event is at full capacity.' });
          }
        }
      }

      if (existingBooking) {
        if (existingBooking.status === 'pending_approval' && !approvalRequired) {
          await prisma.$transaction(async (tx) => {
            await tx.bookings.update({
              where: { id: existingBooking.id },
              data: { status: 'confirmed' }
            });
            const lineItems = await tx.booking_line_items.findMany({
              where: { booking_id: existingBooking.id }
            });
            const liIds = lineItems.map(li => li.id);
            await tx.tickets.updateMany({
              where: { line_item_id: { in: liIds } },
              data: { status: 'confirmed' }
            });
          });

          try {
            const logs = await prisma.notification_log.findMany({
              where: {
                template_key: 'event_join_request',
                status: { not: 'read' }
              }
            });

            for (const log of logs) {
              try {
                const data = JSON.parse(log.provider_ref || '{}');
                if (data.eventId === eventId && data.requesterId === userId) {
                  await prisma.notification_log.update({
                    where: { id: log.id },
                    data: { status: 'read' }
                  });
                  const { sendNotificationToUser } = require('../services/messagingSocket');
                  sendNotificationToUser(log.user_id, 'notification.acted', {
                    notificationId: log.id,
                    action: 'accepted'
                  });
                }
              } catch {}
            }
          } catch (e) {
            console.error('Error auto-resolving event notifications on join:', e);
          }

          const groupsNamespace = (fastify as any).io?.of('/groups');
          if (groupsNamespace) {
            groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', { action: 'join', eventId });
          }
          return reply.send({ success: true, status: 'confirmed', message: 'Joined event successfully.' });
        }
        return reply.status(400).send({
          success: false,
          message: existingBooking.status === 'confirmed' ? 'Already registered for this event.' : 'Join request is already pending approval.'
        });
      }

      // Clear any cancelled or expired booking for this user to make room
      const bookingsToDelete = await prisma.bookings.findMany({
        where: {
          event_id: eventId,
          booker_user_id: userId,
          status: { in: ['cancelled', 'expired'] }
        },
        select: { id: true }
      });
      if (bookingsToDelete.length > 0) {
        const deleteIds = bookingsToDelete.map(b => b.id);
        
        const lineItems = await prisma.booking_line_items.findMany({
          where: { booking_id: { in: deleteIds } },
          select: { id: true }
        });
        const liIds = lineItems.map(l => l.id);
        
        const tickets = await prisma.tickets.findMany({
          where: { line_item_id: { in: liIds } },
          select: { id: true }
        });
        const tIds = tickets.map(t => t.id);

        if (tIds.length > 0) {
          await prisma.checkins.deleteMany({
            where: { ticket_id: { in: tIds } }
          });
          await prisma.tickets.deleteMany({
            where: { id: { in: tIds } }
          });
        }
        
        if (liIds.length > 0) {
          await prisma.booking_line_items.deleteMany({
            where: { id: { in: liIds } }
          });
        }
        
        await prisma.attendees.deleteMany({
          where: { booking_id: { in: deleteIds } }
        });
        await prisma.bookings.deleteMany({
          where: { id: { in: deleteIds } }
        });
      }

      // Get or create a ticket type
      let ticketType = await prisma.ticket_types.findFirst({
        where: { event_id: eventId }
      });
      if (!ticketType) {
        ticketType = await prisma.ticket_types.create({
          data: {
            tenant_id: event.tenant_id,
            event_id: eventId,
            name: 'General RSVP',
            price_amount_minor: 0,
            price_currency: 'INR',
            capacity: event.capacity_total
          }
        });
      }

      const answers = request.body || {};
      const initialStatus = isWaitlisted ? 'waitlisted' : (approvalRequired ? 'pending_approval' : 'confirmed');
      const initialTicketStatus = isWaitlisted ? 'waitlisted' : (approvalRequired ? 'reserved' : 'confirmed');

      // Remove from wishlist if they join
      await EventService.removeWishlist(eventId, userId).catch(err => console.error('Failed to auto-remove from wishlist', err));

      // Perform transaction to create booking, line item, ticket, and attendee
      const { booking, ticket } = await prisma.$transaction(async (tx) => {
        const bk = await tx.bookings.create({
          data: {
            tenant_id: event.tenant_id,
            event_id: eventId,
            booker_user_id: userId,
            status: initialStatus,
            payment_method: 'free',
            total_amount_minor: 0,
            total_currency: 'INR'
          }
        });

        const li = await tx.booking_line_items.create({
          data: {
            tenant_id: event.tenant_id,
            booking_id: bk.id,
            ticket_type_id: ticketType.id,
            quantity: 1,
            unit_price_amount_minor: 0,
            unit_price_currency: 'INR'
          }
        });

        let tk = await tx.tickets.create({
          data: {
            tenant_id: event.tenant_id,
            line_item_id: li.id,
            attendee_name: requesterName,
            attendee_email: requesterEmail,
            qr_token: require('crypto').randomUUID(),
            status: initialTicketStatus,
            claimed_by_user_id: userId
          }
        });

        // ticket_code is derived from the ticket's own id (only known after insert) using the
        // exact same formula the client uses to display a "friendly" ticket id in the UI
        // (see normalizeJoinedEvent in client/src/home-tickets.tsx). Keeping these in sync is
        // what lets a scanner manually type the on-screen ticket id and have it resolve.
        tk = await tx.tickets.update({
          where: { id: tk.id },
          data: { ticket_code: computeTicketCode(event.title, tk.id) }
        });

        await tx.attendees.create({
          data: {
            tenant_id: event.tenant_id,
            booking_id: bk.id,
            ticket_id: tk.id,
            user_id: userId,
            name: requesterName,
            email: requesterEmail,
            checkin_status: 'not_checked_in',
            notes: JSON.stringify(answers)
          }
        });

        return { booking: bk, ticket: tk };
      });

      // Auto-remove from wishlist if successful
      await EventService.removeWishlist(eventId, userId).catch(() => {});

      // Invite unlocks the normal join flow above; it doesn't auto-confirm. Consume it now
      // that the request has actually gone through, so it can't be reused.
      if (isInviteOnly && !isHostOrCoHost && inviteToken) {
        await EventInvitationService.consumeToken(inviteToken, userId, 'join');
      }

      if (approvalRequired) {
        let ownerUserId = null;
        const entityRow = await prisma.entities.findUnique({
          where: { id: event.hosted_by_entity_id }
        });
        if (entityRow) {
          ownerUserId = entityRow.user_id;
        }
        if (!ownerUserId) {
          const ownerRole = await prisma.roles.findFirst({
            where: { key: 'group_owner' }
          });
          if (ownerRole) {
            const assignment = await prisma.role_assignments.findFirst({
              where: {
                scope_entity_id: event.hosted_by_entity_id,
                role_id: ownerRole.id
              }
            });
            if (assignment) {
              ownerUserId = assignment.user_id;
            }
          }
        }
        if (!ownerUserId) {
          ownerUserId = userId; // Fallback
        }

        // Create notification for owner/admin
        const venueObj: any = typeof event.venue === 'string' && event.venue.trim().startsWith('{')
        ? JSON.parse(event.venue)
        : (event.venue || {});
      const eventMeta = venueObj?.meta || {};
      const formFields = Array.isArray(eventMeta?.formFields) ? eventMeta.formFields : [];
      const questionLabels = formFields.reduce((acc: Record<string, string>, field: any) => {
        if (field?.id && field?.question) {
          acc[field.id] = field.question;
        }
        return acc;
      }, {});

      const notif = await prisma.notification_log.create({
          data: {
            tenant_id: event.tenant_id,
            user_id: ownerUserId,
            channel: 'app',
            template_key: 'event_join_request',
            status: 'queued',
            provider_ref: JSON.stringify({
              eventId,
              eventTitle: event.title,
              requesterId: userId,
              requesterName,
              answers,
              questionLabels
            })
          }
        });

        // Trigger socket emit if available
        const chatNamespace = (fastify as any).io?.of('/chat');
        if (chatNamespace) {
          chatNamespace.to(`user:${ownerUserId}`).emit('group.notification', {
            id: notif.id,
            type: 'registration',
            text: `<b>${requesterName}</b> requested to join <b>${event.title}</b>`,
            eventId: eventId,
            answers,
            questionLabels
          });
        }

        const groupsNamespace = (fastify as any).io?.of('/groups');
        if (groupsNamespace) {
          groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', { action: 'request-join', eventId });
        }

        return reply.send({ success: true, status: 'pending', message: 'Join request submitted for approval.' });
      } else {
        const groupsNamespace = (fastify as any).io?.of('/groups');
        if (groupsNamespace) {
          groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', { action: 'join', eventId });
        }

        let emailMsg = '';
        if (requesterEmail) {
          try {
            const dateStr = event.starts_at ? new Date(event.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBD';
            const vObj = (event.venue as any) || {};
            const venueStr = vObj.address || vObj.name || event.location_type || 'TBD';
            const htmlContent = generateTicketHtml({
              qrToken: ticket.qr_token,
              ticketCode: ticket.ticket_code || ticket.id,
              attendeeName: requesterName,
              dateString: dateStr,
              venueString: venueStr,
              paidAmount: booking.payment_method === 'free' ? 'Free' : `₹${booking.total_amount_minor || 0}`,
              status: ticket.status === 'confirmed' ? 'Confirmed' : 'Reserved'
            });

            await sendEmail({
              to: requesterEmail,
              subject: `Your ticket for ${event.title}`,
              html: htmlContent
            });
            console.log(`Ticket email sent to ${requesterEmail}`);
            emailMsg = ` Ticket emailed to ${requesterEmail}.`;
          } catch (err: any) {
            console.error('Failed to send ticket email:', err);
            emailMsg = ` Failed to email ticket.`;
          }
        } else {
          emailMsg = ` No email address found for user.`;
        }

        return reply.send({ success: true, status: 'confirmed', message: 'Joined event successfully.' + emailMsg });
      }
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/events/requests/:notificationId/action
  fastify.post<{ Params: { notificationId: string }, Body: { action: 'accept' | 'decline' } }>('/events/requests/:notificationId/action', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const { notificationId } = request.params;
    const { action } = request.body || {};

    try {
      const log = await prisma.notification_log.findUnique({
        where: { id: notificationId }
      });
      if (!log || log.template_key !== 'event_join_request') {
        return reply.status(404).send({ success: false, message: 'Request not found' });
      }

      const data = JSON.parse(log.provider_ref || '{}');
      const { eventId, eventTitle, requesterId, requesterName } = data;

      // Mark the original join request notification as read/acted
      await prisma.notification_log.update({
        where: { id: notificationId },
        data: { status: 'read' }
      });

      // Update the database booking, line items and tickets status
      const booking = await prisma.bookings.findFirst({
        where: {
          event_id: eventId,
          booker_user_id: requesterId,
          status: 'pending_approval'
        }
      });

      if (booking) {
        const nextStatus = action === 'accept' ? 'confirmed' : 'cancelled';
        const nextTicketStatus = action === 'accept' ? 'confirmed' : 'cancelled';

        await prisma.$transaction(async (tx) => {
          await tx.bookings.update({
            where: { id: booking.id },
            data: { status: nextStatus }
          });
          const lineItems = await tx.booking_line_items.findMany({
            where: { booking_id: booking.id }
          });
          const liIds = lineItems.map(li => li.id);
          await tx.tickets.updateMany({
            where: { line_item_id: { in: liIds } },
            data: { status: nextTicketStatus }
          });
        });
        
        if (action === 'decline') {
          const { EventService } = require('../services/EventService');
          await EventService.promoteFromWaitlist(eventId, 1);
        }
      }

      if (action === 'accept') {
        // Send accepted notification to the guest (requester)
        await prisma.notification_log.create({
          data: {
            tenant_id: log.tenant_id,
            user_id: requesterId,
            channel: 'app',
            template_key: 'event_request_accepted',
            status: 'queued',
            provider_ref: JSON.stringify({
              eventId,
              eventTitle
            })
          }
        });

        // Trigger socket emit to guest
        const chatNamespace = (fastify as any).io?.of('/chat');
        if (chatNamespace) {
          chatNamespace.to(`user:${requesterId}`).emit('group.notification', {
            type: 'event',
            text: `Your request to join <b>${eventTitle}</b> was accepted! 🎉`,
            eventId
          });
        }

        const chatNamespace2 = (fastify as any).io?.of('/chat');
        if (chatNamespace2) {
          chatNamespace2.to(`user:${userId}`).emit('notification.acted', {
            notificationId,
            action: 'accepted'
          });
        }

        const groupsNamespace = (fastify as any).io?.of('/groups');
        if (groupsNamespace) {
          groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', { action: 'accept', eventId });
        }

        try {
          const userRec = await prisma.users.findUnique({ where: { id: requesterId } });
          if (userRec?.primary_email && booking) {
            const li = await prisma.booking_line_items.findFirst({ where: { booking_id: booking.id } });
            if (li) {
              const tk = await prisma.tickets.findFirst({ where: { line_item_id: li.id } });
              if (tk) {
                // Fetch the real event so we can show the correct date and venue
                const eventForEmail = await prisma.events.findUnique({ where: { id: eventId } });
                const vObj = (eventForEmail?.venue as any) || {};
                const dateStr = eventForEmail?.starts_at
                  ? new Date(eventForEmail.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : 'TBD';
                const venueStr = vObj.address || vObj.name || eventForEmail?.location_type || 'TBD';
                const htmlContent = generateTicketHtml({
                  qrToken: tk.qr_token,
                  ticketCode: tk.ticket_code || tk.id,
                  attendeeName: requesterName,
                  dateString: dateStr,
                  venueString: venueStr,
                  paidAmount: booking.payment_method === 'free' ? 'Free' : `₹${Number(booking.total_amount_minor || 0) / 100}`,
                  status: 'Confirmed'
                });

                await sendEmail({
                  to: userRec.primary_email,
                  subject: `Your ticket for ${eventTitle}`,
                  html: htmlContent
                });
                console.log(`[messagingRoutes] Ticket acceptance email sent to ${userRec.primary_email}`);
              }
            }
          }
        } catch (err: any) {
          console.error('[messagingRoutes] Failed to send accept email:', err);
        }

        return reply.send({ success: true, action: 'accepted' });
      } else {
        // Send declined notification to the guest (requester)
        await prisma.notification_log.create({
          data: {
            tenant_id: log.tenant_id,
            user_id: requesterId,
            channel: 'app',
            template_key: 'event_request_declined',
            status: 'queued',
            provider_ref: JSON.stringify({
              eventId,
              eventTitle
            })
          }
        });

        // Trigger socket emit to guest
        const chatNamespace = (fastify as any).io?.of('/chat');
        if (chatNamespace) {
          chatNamespace.to(`user:${requesterId}`).emit('group.notification', {
            type: 'system',
            text: `Your request to join <b>${eventTitle}</b> was declined`
          });
        }

        const chatNamespace2 = (fastify as any).io?.of('/chat');
        if (chatNamespace2) {
          chatNamespace2.to(`user:${userId}`).emit('notification.acted', {
            notificationId,
            action: 'declined'
          });
        }

        const groupsNamespace = (fastify as any).io?.of('/groups');
        if (groupsNamespace) {
          groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', { action: 'decline', eventId });
        }

        return reply.send({ success: true, action: 'declined' });
      }
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // POST /api/messaging/groups/requests/:notificationId/action
  fastify.post<{ Params: { notificationId: string }, Body: { action: 'accept' | 'decline' } }>('/groups/requests/:notificationId/action', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const { notificationId } = request.params;
    const { action } = request.body || {};

    try {
      const log = await prisma.notification_log.findUnique({
        where: { id: notificationId }
      });
      if (!log || log.template_key !== 'group_join_request') {
        return reply.status(404).send({ success: false, message: 'Request not found' });
      }

      const data = JSON.parse(log.provider_ref || '{}');
      const { groupId, requesterId } = data;

      // Mark request as read
      await prisma.notification_log.update({
        where: { id: notificationId },
        data: { status: 'read' }
      });

      if (action === 'accept') {
        // Approve membership using GroupService
        await GroupService.approveMembership(groupId, requesterId, userId);
      } else {
        // Reject membership using GroupService
        await GroupService.rejectMembership(groupId, requesterId, userId);
      }

      // Emit notification.acted to self/other tabs
      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        chatNamespace.to(`user:${userId}`).emit('notification.acted', {
          notificationId,
          action: action === 'accept' ? 'accepted' : 'declined'
        });
      }

      const groupsNamespace = (fastify as any).io?.of('/groups');
      if (groupsNamespace) {
        groupsNamespace.to(`group_${groupId}`).emit('dashboard_updated', { action: action === 'accept' ? 'approve_member' : 'reject_member' });
      }

      return reply.send({ success: true, action: action === 'accept' ? 'accepted' : 'declined' });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}

