import { FastifyInstance } from "fastify";
import prisma from "../config/prisma";
import crypto from "crypto";

export async function messagingTestRoutes(fastify: FastifyInstance) {

  /**
   * List all users.
   */
  fastify.get("/users", async (request, reply) => {
    try {
      const users = await prisma.users.findMany({ 
        take: 20,
        include: { profiles: { select: { display_name: true } } }
      });
      return { 
        success: true, 
        data: users.map(u => ({ 
          id: u.id, 
          name: u.profiles?.display_name || u.primary_email || "Unknown User",
          label: u.profiles?.display_name || u.primary_email || "Unknown User"
        })) 
      };
    } catch (error: any) {
      fastify.log.error(error, "GET /users failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Search users.
   */
  fastify.get("/users/search", async (request, reply) => {
    try {
      const { q } = request.query as any;
      if (!q) {
        return { success: true, data: [] };
      }
      
      const users = await prisma.users.findMany({
        where: {
          OR: [
            { primary_email: { contains: q, mode: 'insensitive' } },
            { profiles: { display_name: { contains: q, mode: 'insensitive' } } }
          ]
        },
        include: {
          profiles: {
            select: {
              display_name: true
            }
          }
        },
        take: 10
      });
      
      const results = users.map(u => ({
        id: u.id,
        name: u.profiles?.display_name || 'Unknown User',
        email: u.primary_email || 'No email'
      }));

      return { success: true, data: results };
    } catch (error: any) {
      fastify.log.error(error, "GET /users/search failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Fetch all conversations for a user.
   */
  fastify.get("/conversations", async (request, reply) => {
    try {
      const { userId, limit } = request.query as any;
      if (!userId) {
        return reply.status(400).send({ success: false, error: "userId query param is required" });
      }
      
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
        take: Number(limit) || 50,
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

      return { success: true, data: mapped };
    } catch (error: any) {
      fastify.log.error(error, "GET /conversations failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Get single conversation details.
   */
  fastify.get("/conversations/:id", async (request, reply) => {
    try {
      const { id } = request.params as any;
      const conversation = await prisma.conversations.findUnique({
        where: { id },
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
      if (!conversation) {
        return reply.status(404).send({ success: false, error: "Conversation not found" });
      }
      return {
        success: true,
        data: {
          id: conversation.id,
          type: conversation.type === "dm" ? "DIRECT" : "GROUP",
          title: conversation.title || null,
          createdById: conversation.created_by,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          participants: conversation.conversation_participants.map(p => ({
            userId: p.user_id,
            role: p.role,
            name: p.users?.profiles?.display_name || p.users?.primary_email || "Unknown User"
          }))
        }
      };
    } catch (error: any) {
      fastify.log.error(error, "GET /conversations/:id failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Helper to calculate presence status.
   */
  const getCalculatedStatus = (activeConnections: number, lastSeenAt: Date | null): string => {
    if (activeConnections > 0) {
      return "ONLINE";
    }
    if (!lastSeenAt) {
      return "OFFLINE";
    }
    const ageMs = Date.now() - new Date(lastSeenAt).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (ageMs < twentyFourHoursMs) {
      return "RECENTLY_ONLINE";
    }
    return "OFFLINE";
  };

  /**
   * Batch get presence.
   */
  fastify.post("/presence/batch", async (request, reply) => {
    try {
      const { userIds } = request.body as any;
      if (!Array.isArray(userIds)) {
        return reply.status(400).send({ success: false, error: "userIds must be an array" });
      }
      if (userIds.length === 0) {
        return { success: true, data: [] };
      }
      
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT user_id, active_connections, status, last_seen_at FROM presences WHERE user_id IN (${userIds.map((_, i) => `$${i + 1}`).join(', ')})`,
        ...userIds
      );
      const map = new Map(rows.map(r => [r.user_id, r]));
      const result = userIds.map(uid => {
        const p = map.get(uid);
        const activeConns = p?.active_connections || 0;
        const lastSeen = p?.last_seen_at || null;
        return {
          userId: uid,
          status: getCalculatedStatus(activeConns, lastSeen),
          activeConnections: activeConns,
          lastSeenAt: lastSeen
        };
      });
      return { success: true, data: result };
    } catch (error: any) {
      fastify.log.error(error, "POST /presence/batch failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Get presence of a specific user.
   */
  fastify.get("/presence/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as any;
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT user_id, active_connections, status, last_seen_at FROM presences WHERE user_id = $1`,
        userId
      );
      const p = rows[0];
      const activeConns = p?.active_connections || 0;
      const lastSeen = p?.last_seen_at || null;
      return {
        success: true,
        data: {
          userId,
          status: getCalculatedStatus(activeConns, lastSeen),
          activeConnections: activeConns,
          lastSeenAt: lastSeen
        }
      };
    } catch (error: any) {
      fastify.log.error(error, "GET /presence/:userId failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Create a direct conversation between two users (idempotent).
   */
  fastify.post("/conversations/direct", async (request, reply) => {
    try {
      const { creatorId, targetId } = request.body as any;
      if (!creatorId || !targetId) {
        return reply.status(400).send({ success: false, error: "creatorId and targetId are required" });
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
          conversation_participants: true
        }
      });

      if (existing) {
        return reply.status(200).send({
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
              role: p.role
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
          conversation_participants: true
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
            role: p.role
          }))
        }
      });
    } catch (error: any) {
      fastify.log.error(error, "POST /conversations/direct failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Accept direct conversation.
   */
  fastify.post("/conversations/direct/accept", async (request, reply) => {
    return { success: true };
  });

  /**
   * Decline direct conversation.
   */
  fastify.post("/conversations/direct/decline", async (request, reply) => {
    return { success: true };
  });

  /**
   * Create a group conversation.
   */
  fastify.post("/conversations/group", async (request, reply) => {
    try {
      const { creatorId, title, participantIds } = request.body as any;
      if (!creatorId || !title) {
        return reply.status(400).send({ success: false, error: "creatorId and title are required" });
      }

      const uniqueParticipantIds = Array.from(new Set([creatorId, ...(participantIds || [])]));

      const conversation = await prisma.conversations.create({
        data: {
          tenant_id: "00000000-0000-0000-0000-000000000000",
          type: "group" as any,
          title: title,
          created_by: creatorId,
          conversation_participants: {
            createMany: {
              data: uniqueParticipantIds.map(uid => ({
                user_id: uid,
                role: uid === creatorId ? "admin" : "member"
              }))
            }
          }
        },
        include: {
          conversation_participants: true
        }
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: conversation.id,
          type: "GROUP",
          title: conversation.title,
          createdById: conversation.created_by,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          participants: (conversation as any).conversation_participants.map((p: any) => ({
            userId: p.user_id,
            role: p.role
          }))
        }
      });
    } catch (error: any) {
      fastify.log.error(error, "POST /conversations/group failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Send a message via HTTP POST.
   */
  fastify.post("/messages", async (request, reply) => {
    try {
      const { senderId, conversationId, content } = request.body as any;
      if (!senderId || !conversationId || !content) {
        return reply.status(400).send({ success: false, error: "senderId, conversationId and content are required" });
      }

      const message = await prisma.messages.create({
        data: {
          tenant_id: "00000000-0000-0000-0000-000000000000",
          conversation_id: conversationId,
          sender_user_id: senderId,
          body: content
        }
      });

      await prisma.conversations.update({
        where: { id: conversationId },
        data: { updated_at: new Date() }
      });

      const eventPayload = {
        id: message.id,
        messageId: message.id,
        conversationId,
        senderId,
        content: message.body,
        createdAt: message.created_at
      };

      // Broadcast to socket room if socket server is attached
      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        chatNamespace.to(`conversation:${conversationId}`).emit("message.created", eventPayload);
      }

      return reply.status(201).send({ success: true, data: eventPayload });
    } catch (error: any) {
      fastify.log.error(error, "POST /messages failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Fetch messages in a conversation.
   */
  fastify.get("/messages/:conversationId", async (request, reply) => {
    try {
      const { conversationId } = request.params as any;
      const { limit } = request.query as any;

      const messages = await prisma.messages.findMany({
        where: { 
          conversation_id: conversationId,
          is_deleted: false
        },
        orderBy: { created_at: "desc" },
        take: Number(limit) || 100
      });

      const mapped = messages.map(m => ({
        id: m.id,
        messageId: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_user_id,
        content: m.body,
        body: m.body,
        isEdited: m.is_edited,
        createdAt: m.created_at
      })).reverse();

      return { success: true, data: mapped };
    } catch (error: any) {
      fastify.log.error(error, "GET /messages/:conversationId failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Edit a message.
   */
  fastify.put("/messages/:messageId", async (request, reply) => {
    try {
      const { messageId } = request.params as any;
      const { content } = request.body as any;
      if (!content) {
        return reply.status(400).send({ success: false, error: "content is required" });
      }

      const original = await prisma.messages.findUnique({
        where: { id: messageId }
      });

      if (!original) {
        return reply.status(404).send({ success: false, error: "Message not found" });
      }

      if (original.is_deleted) {
        return reply.status(400).send({ success: false, error: "Cannot edit a deleted message" });
      }

      // Check time constraint: 3 minutes (180,000ms)
      const elapsed = Date.now() - original.created_at.getTime();
      if (elapsed > 180000) {
        return reply.status(400).send({ success: false, error: "Time limit exceeded (3 minutes) to edit this message" });
      }

      const updated = await prisma.messages.update({
        where: { id: messageId },
        data: { 
          body: content,
          is_edited: true,
          updated_at: new Date()
        }
      });

      return { 
        success: true, 
        data: {
          id: updated.id,
          messageId: updated.id,
          conversationId: updated.conversation_id,
          senderId: updated.sender_user_id,
          content: updated.body,
          body: updated.body,
          isEdited: updated.is_edited,
          createdAt: updated.created_at
        } 
      };
    } catch (error: any) {
      fastify.log.error(error, "PUT /messages/:messageId failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Delete a message.
   */
  fastify.delete("/messages/:messageId", async (request, reply) => {
    try {
      const { messageId } = request.params as any;

      const original = await prisma.messages.findUnique({
        where: { id: messageId }
      });

      if (!original) {
        return reply.status(404).send({ success: false, error: "Message not found" });
      }

      // Check time constraint: 5 minutes (300,000ms)
      const elapsed = Date.now() - original.created_at.getTime();
      if (elapsed > 300000) {
        return reply.status(400).send({ success: false, error: "Time limit exceeded (5 minutes) to delete this message" });
      }

      // Soft delete: keep in DB but set is_deleted to true
      await prisma.messages.update({
        where: { id: messageId },
        data: { 
          is_deleted: true,
          updated_at: new Date()
        }
      });

      return { success: true };
    } catch (error: any) {
      fastify.log.error(error, "DELETE /messages/:messageId failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Add a reaction.
   */
  fastify.post("/reactions", async (request, reply) => {
    try {
      const { actorId, messageId, emoji } = request.body as any;
      if (!actorId || !messageId || !emoji) {
        return reply.status(400).send({ success: false, error: "actorId, messageId and emoji are required" });
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO reactions (id, message_id, user_id, emoji, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, now())
         ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
        messageId, actorId, emoji
      );

      return { success: true };
    } catch (error: any) {
      fastify.log.error(error, "POST /reactions failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Remove a reaction.
   */
  fastify.delete("/reactions", async (request, reply) => {
    try {
      const { actorId, messageId, emoji } = request.body as any;
      if (!actorId || !messageId || !emoji) {
        return reply.status(400).send({ success: false, error: "actorId, messageId and emoji are required" });
      }

      await prisma.$executeRawUnsafe(
        `DELETE FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
        messageId, actorId, emoji
      );

      return { success: true };
    } catch (error: any) {
      fastify.log.error(error, "DELETE /reactions failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Submit a report.
   */
  fastify.post("/report", async (request, reply) => {
    try {
      const { reporterId, targetId, targetType, reason, severity, description } = request.body as any;
      if (!reporterId || !targetId || !targetType || !reason || !severity) {
        return reply.status(400).send({ success: false, error: "reporterId, targetId, targetType, reason and severity are required" });
      }

      const id = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO reports (id, target_type, target_id, reporter_id, reason, severity, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', now(), now())`,
        id, targetType, targetId, reporterId, reason, severity, description
      );

      return reply.status(201).send({ success: true, data: { id } });
    } catch (error: any) {
      fastify.log.error(error, "POST /report failed");
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  /**
   * Assign, resolve, hide, delete moderation stubs.
   */
  fastify.post("/moderation/assign", async () => ({ success: true }));
  fastify.post("/moderation/resolve", async () => ({ success: true }));
  fastify.post("/moderation/hide", async () => ({ success: true }));
  fastify.post("/moderation/delete-content", async () => ({ success: true }));

  /**
   * Health check.
   */
  fastify.get("/health", async () => {
    return { success: true, data: { status: "healthy" } };
  });
}
