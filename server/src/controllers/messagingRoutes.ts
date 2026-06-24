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

      const mapped = conversations.map(c => ({
        id: c.id,
        type: c.type === "dm" ? "DIRECT" : "GROUP",
        title: c.title || null,
        createdById: c.created_by,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        participants: c.conversation_participants.map(p => ({
          userId: p.user_id,
          role: p.role,
          name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User"
        }))
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
          message_receipts: true
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
