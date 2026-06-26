import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';

export async function messagingRoutes(fastify: FastifyInstance) {
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
                    select: { display_name: true }
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
            name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User"
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
      const { targetId } = request.body as any;
      if (!targetId) {
        return reply.status(400).send({ success: false, error: "targetId is required" });
      }

      // Check target's messaging restriction policy
      const targetProfile = await prisma.profiles.findUnique({
        where: { user_id: targetId }
      });
      const restriction = targetProfile?.messaging_restriction || 'anyone';

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
      } else if (restriction === 'approval_required') {
        const approved = await prisma.messaging_requests.findFirst({
          where: {
            status: 'ACCEPTED',
            OR: [
              { sender_id: creatorId, receiver_id: targetId },
              { sender_id: targetId, receiver_id: creatorId }
            ]
          }
        });
        if (!approved) {
          const pending = await prisma.messaging_requests.findFirst({
            where: {
              sender_id: creatorId,
              receiver_id: targetId,
              status: 'PENDING'
            }
          });
          return reply.status(403).send({
            success: false,
            error: "Approval required to start messaging.",
            restriction: "approval_required",
            hasPending: !!pending
          });
        }
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
                    select: { display_name: true }
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
              name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User"
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
                    select: { display_name: true }
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
            name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User"
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
      
      const pendingRequests = await prisma.messaging_requests.count({
        where: { receiver_id: userId, status: 'PENDING' }
      });

      return reply.send({
        success: true,
        data: {
          messages: uniqueSenders.size,
          notifs: pendingRequests // map pending requests as notification count
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
}
