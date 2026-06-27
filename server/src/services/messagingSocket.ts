import { Server, Socket } from "socket.io";
import prisma from "../config/prisma";
import { DEFAULT_CHAT_SETTINGS } from "../settings-library/settingsSeeder";

let chatNamespace: any = null;

async function getChatSettings() {
  const row = await prisma.platform_settings.findFirst({
    where: { scope_tenant_id: null, key: 'chat_settings' }
  });
  if (row && row.value) {
    return { ...DEFAULT_CHAT_SETTINGS, ...(row.value as any) };
  }
  return DEFAULT_CHAT_SETTINGS;
}

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

export async function startMessaging(io: Server): Promise<void> {
  console.log("🔄 Starting Messaging Socket Gateway...");

  // Reset all active connections to 0 on startup to clear stale states
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE presences 
       SET active_connections = 0, 
           status = 'OFFLINE', 
           last_seen_at = COALESCE(last_seen_at, now()), 
           updated_at = now()`
    );
    console.log("✅ Reset active connections and status for all users on startup.");
  } catch (err) {
    console.error("❌ Error resetting presences on startup:", err);
  }

  chatNamespace = io.of("/chat");

  chatNamespace.on("connection", async (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string") {
      console.warn("⚠️ Socket connection rejected: Missing token");
      socket.disconnect(true);
      return;
    }

    let userId: string;
    try {
      const rawToken = token.startsWith("Bearer ") ? token.substring(7) : token;
      const parts = rawToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
        userId = payload.id;
      } else {
        userId = token; // Fallback for testing/mock IDs
      }
      if (!userId) {
        throw new Error("No user ID in token");
      }
    } catch (err: any) {
      console.warn("⚠️ Socket connection rejected: Invalid token format", err.message);
      socket.disconnect(true);
      return;
    }

    const socketRooms = new Set<string>();

    console.log(`🔌 User connected to chat: ${userId} (Socket: ${socket.id})`);

    socket.join(`user:${userId}`);
    socketRooms.add(`user:${userId}`);

    // Increment active connection count atomically in database (asynchronously to avoid blocking listener registration)
    prisma.$executeRawUnsafe(
      `INSERT INTO presences (user_id, status, active_connections, last_seen_at, updated_at)
       VALUES ($1, 'ONLINE', 1, NULL, now())
       ON CONFLICT (user_id) DO UPDATE
       SET status = 'ONLINE', active_connections = presences.active_connections + 1, updated_at = now()`,
      userId
    )
    .then(async () => {
      console.log(`✅ Presence on connect updated for user: ${userId}`);
      
      // Mark undelivered messages as delivered
      try {
        const participations = await prisma.conversation_participants.findMany({
          where: { user_id: userId },
          select: { conversation_id: true }
        });
        const conversationIds = participations.map(p => p.conversation_id);

        if (conversationIds.length > 0) {
          const undeliveredMessages = await prisma.messages.findMany({
            where: {
              conversation_id: { in: conversationIds },
              sender_user_id: { not: userId },
              is_deleted: false,
              OR: [
                {
                  message_receipts: {
                    none: { user_id: userId }
                  }
                },
                {
                  message_receipts: {
                    some: {
                      user_id: userId,
                      delivered_at: null
                    }
                  }
                }
              ]
            },
            select: { id: true, conversation_id: true }
          });

          if (undeliveredMessages.length > 0) {
            const now = new Date();
            const updates = [];
            for (const msg of undeliveredMessages) {
              await prisma.message_receipts.upsert({
                where: {
                  message_id_user_id: {
                    message_id: msg.id,
                    user_id: userId
                  }
                },
                create: {
                  message_id: msg.id,
                  user_id: userId,
                  delivered_at: now
                },
                update: {
                  delivered_at: now
                }
              });
              updates.push({
                messageId: msg.id,
                conversationId: msg.conversation_id,
                userId,
                deliveredAt: now,
                seenAt: null
              });
            }

            const byConv: { [key: string]: typeof updates } = {};
            for (const u of updates) {
              if (!byConv[u.conversationId]) byConv[u.conversationId] = [];
              byConv[u.conversationId].push(u);
            }

            for (const [convId, list] of Object.entries(byConv)) {
              chatNamespace.to(`conversation:${convId}`).emit("receipt.updated", list);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Error setting delivered status on socket connect for ${userId}:`, err);
      }
    })
    .catch((err) => {
      console.error(`❌ Error updating presence on connect for ${userId}:`, err);
    });

    // Join conversation room
    socket.on("conversation.join", async (payload: { conversationId: string }, callback: any) => {
      try {
        const { conversationId } = payload;
        if (!conversationId) {
          if (callback) callback({ success: false, error: "conversationId is required" });
          return;
        }

        // Verify if user is participant
        const participant = await prisma.conversation_participants.findUnique({
          where: {
            conversation_id_user_id: {
              conversation_id: conversationId,
              user_id: userId
            }
          }
        });

        if (!participant) {
          if (callback) callback({ success: false, error: "User is not a participant of this conversation" });
          return;
        }

        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        socketRooms.add(roomName);

        console.log(`👤 User ${userId} joined room ${roomName}`);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Send message to conversation
    socket.on("message.send", async (payload: { conversationId: string, content: string, replyToMessageId?: string }, callback: any) => {
      try {
        const { conversationId, content, replyToMessageId } = payload;
        if (!conversationId || !content) {
          if (callback) callback({ success: false, error: "conversationId and content are required" });
          return;
        }

        // Verify if user is participant
        const participant = await prisma.conversation_participants.findUnique({
          where: {
            conversation_id_user_id: {
              conversation_id: conversationId,
              user_id: userId
            }
          }
        });

        if (!participant) {
          if (callback) callback({ success: false, error: "User is not a participant of this conversation" });
          return;
        }

        // Fetch conversation to determine the type
        const conversation = await prisma.conversations.findUnique({
          where: { id: conversationId }
        });
        if (!conversation) {
          if (callback) callback({ success: false, error: "Conversation not found" });
          return;
        }

        // Enforce Chat Settings and Policies
        const settings = await getChatSettings();

        if (settings.allowSiteMessaging === false) {
          if (callback) callback({ success: false, error: "Messaging is disabled globally by the administrator" });
          return;
        }
        
        let isFeatureAllowed = true;
        let allowedRoles: string[] = [];
        let featureName = "";

        if (conversation.event_id) {
          isFeatureAllowed = settings.allowEventChat;
          allowedRoles = settings.rolePermissions?.eventChat || [];
          featureName = "Event chat";
        } else if (conversation.type === "group") {
          isFeatureAllowed = settings.allowGroupChat;
          allowedRoles = settings.rolePermissions?.groupChat || [];
          featureName = "Group chat";
        } else if (conversation.type === "dm") {
          isFeatureAllowed = settings.allowDirectMessaging;
          allowedRoles = settings.rolePermissions?.directMessaging || [];
          featureName = "Direct messaging";

          if (!isFeatureAllowed) {
            const isGroupEnabled = settings.allowGroupChat;
            const isEventEnabled = settings.allowEventChat;
            if (isGroupEnabled || isEventEnabled) {
              const otherParticipant = await prisma.conversation_participants.findFirst({
                where: {
                  conversation_id: conversationId,
                  user_id: { not: userId }
                }
              });
              if (otherParticipant) {
                const shareCommon = await shareCommonGroupOrEvent(userId, otherParticipant.user_id);
                if (shareCommon) {
                  isFeatureAllowed = true;
                }
              }
            }
          }
        }

        if (!isFeatureAllowed) {
          if (callback) callback({ success: false, error: `${featureName} is disabled by the administrator` });
          return;
        }

        const userRoles = await getUserRoles(userId);
        const hasRolePermission = userRoles.some(r => allowedRoles.includes(r));
        if (!hasRolePermission) {
          if (callback) callback({ success: false, error: `Your role does not have permission to send messages in this chat type` });
          return;
        }

        // Enforce Communication Policies
        const maxLen = settings.communicationPolicies?.maxMessageLength || 2000;
        if (content.length > maxLen) {
          if (callback) callback({ success: false, error: `Message exceeds maximum allowed length of ${maxLen} characters` });
          return;
        }

        const allowLinks = settings.communicationPolicies?.allowLinks !== false;
        if (!allowLinks) {
          const simpleUrlRegex = /(https?:\/\/|www\.)/i;
          if (simpleUrlRegex.test(content)) {
            if (callback) callback({ success: false, error: "Sharing links in messages is disabled by the administrator" });
            return;
          }
        }

        const allowMedia = settings.communicationPolicies?.allowMedia !== false;
        if (!allowMedia) {
          const markdownImageRegex = /!\[.*?\]\(.*?\)/gi;
          if (markdownImageRegex.test(content)) {
            if (callback) callback({ success: false, error: "Sharing media/images in messages is disabled by the administrator" });
            return;
          }
        }

        // Create message in DB
        const message = await prisma.messages.create({
          data: {
            tenant_id: "00000000-0000-0000-0000-000000000000",
            conversation_id: conversationId,
            sender_user_id: userId,
            body: content,
            reply_to_message_id: replyToMessageId || null
          },
          include: {
            users: {
              select: {
                primary_email: true,
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
          }
        });

        // Update conversation activity timestamp
        await prisma.conversations.update({
          where: { id: conversationId },
          data: { updated_at: new Date() }
        });

        // Find other participants
        const otherParticipants = await prisma.conversation_participants.findMany({
          where: {
            conversation_id: conversationId,
            user_id: { not: userId }
          },
          select: { user_id: true }
        });

        const targetIds = otherParticipants.map(op => op.user_id);
        const presences = targetIds.length > 0 ? await prisma.$queryRawUnsafe<any[]>(
          `SELECT user_id, active_connections FROM presences WHERE user_id IN (${targetIds.map((_, i) => `$${i + 1}`).join(', ')})`,
          ...targetIds
        ) : [];
        const presenceMap = new Map(presences.map(p => [p.user_id, p.active_connections > 0]));

        const receiptsList = [];
        const now = new Date();
        for (const op of otherParticipants) {
          const isOnline = presenceMap.get(op.user_id) || false;
          const deliveredAt = isOnline ? now : null;

          await prisma.message_receipts.upsert({
            where: {
              message_id_user_id: {
                message_id: message.id,
                user_id: op.user_id
              }
            },
            create: {
              message_id: message.id,
              user_id: op.user_id,
              delivered_at: deliveredAt
            },
            update: {
              delivered_at: deliveredAt
            }
          });

          // Log the message notification to the database log
          try {
            await prisma.notification_log.create({
              data: {
                tenant_id: "00000000-0000-0000-0000-000000000000",
                user_id: op.user_id,
                channel: "socket",
                template_key: "message_received",
                status: isOnline ? "delivered" : "sent",
                provider_ref: message.id
              }
            });
            console.log(`📝 Logged message notification in notification_log for user ${op.user_id} with ref ${message.id}`);
          } catch (logErr) {
            console.error("❌ Failed to log notification in notification_log:", logErr);
          }

          receiptsList.push({
            messageId: message.id,
            conversationId,
            userId: op.user_id,
            deliveredAt,
            seenAt: null
          });
        }

        const senderName = message.users?.profiles?.display_name || message.users?.primary_email?.split('@')[0] || "Someone";

        const eventPayload = {
          id: message.id,
          messageId: message.id,
          conversationId,
          senderId: userId,
          senderName,
          content: message.body,
          body: message.body,
          createdAt: message.created_at,
          replyToMessageId: message.reply_to_message_id,
          replyTo: message.messages ? {
            id: message.messages.id,
            body: message.messages.body,
            senderId: message.messages.sender_user_id,
            senderName: message.messages.users?.profiles?.display_name || "User"
          } : null,
          receipts: receiptsList
        };

        const roomName = `conversation:${conversationId}`;
        chatNamespace.to(roomName).emit("message.created", eventPayload);

        // Emit real-time notification to all other participants' personal rooms
        targetIds.forEach(tId => {
          chatNamespace.to(`user:${tId}`).emit("message.received", eventPayload);
        });

        console.log(`✉️ Message sent by ${userId} (display: ${senderName}) in room ${roomName}: "${content.substring(0, 30)}..."`);
        if (callback) callback({ success: true, data: eventPayload });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Edit message
    socket.on("message.edit", async (payload: { messageId: string, content: string }, callback: any) => {
      try {
        const { messageId, content } = payload;
        if (!messageId || !content) {
          if (callback) callback({ success: false, error: "messageId and content are required" });
          return;
        }

        const original = await prisma.messages.findUnique({
          where: { id: messageId }
        });

        if (!original) {
          if (callback) callback({ success: false, error: "Message not found" });
          return;
        }

        if (original.sender_user_id !== userId) {
          if (callback) callback({ success: false, error: "Unauthorized to edit this message" });
          return;
        }

        if (original.is_deleted) {
          if (callback) callback({ success: false, error: "Cannot edit a deleted message" });
          return;
        }

        const elapsed = Date.now() - original.created_at.getTime();
        if (elapsed > 180000) {
          if (callback) callback({ success: false, error: "Time limit exceeded (3 minutes) to edit this message" });
          return;
        }

        const updated = await prisma.messages.update({
          where: { id: messageId },
          data: {
            body: content,
            is_edited: true,
            updated_at: new Date()
          }
        });

        const roomName = `conversation:${original.conversation_id}`;
        chatNamespace.to(roomName).emit("message.updated", {
          id: messageId,
          conversationId: original.conversation_id,
          senderId: userId,
          content,
          is_edited: true,
          updatedAt: updated.updated_at
        });

        console.log(`✉️ Message ${messageId} edited by ${userId}: "${content.substring(0, 30)}..."`);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Delete message for everyone (Soft delete)
    socket.on("message.delete", async (payload: { messageId: string }, callback: any) => {
      try {
        const { messageId } = payload;
        if (!messageId) {
          if (callback) callback({ success: false, error: "messageId is required" });
          return;
        }

        const original = await prisma.messages.findUnique({
          where: { id: messageId }
        });

        if (!original) {
          if (callback) callback({ success: false, error: "Message not found" });
          return;
        }

        if (original.sender_user_id !== userId) {
          if (callback) callback({ success: false, error: "Unauthorized to delete this message" });
          return;
        }

        const elapsed = Date.now() - original.created_at.getTime();
        if (elapsed > 300000) {
          if (callback) callback({ success: false, error: "Time limit exceeded (5 minutes) to delete this message" });
          return;
        }

        await prisma.messages.update({
          where: { id: messageId },
          data: {
            is_deleted: true,
            updated_at: new Date()
          }
        });

        const roomName = `conversation:${original.conversation_id}`;
        chatNamespace.to(roomName).emit("message.deleted", {
          id: messageId,
          conversationId: original.conversation_id,
          senderId: userId
        });

        console.log(`✉️ Message ${messageId} soft-deleted by ${userId} for everyone`);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Mark conversation messages as read
    socket.on("conversation.read", async (payload: { conversationId: string }, callback: any) => {
      try {
        const { conversationId } = payload;
        if (!conversationId) {
          if (callback) callback({ success: false, error: "conversationId is required" });
          return;
        }

        const now = new Date();

        const messagesToRead = await prisma.messages.findMany({
          where: {
            conversation_id: conversationId,
            sender_user_id: { not: userId },
            is_deleted: false
          },
          select: { id: true }
        });

        const updates = [];
        if (messagesToRead.length > 0) {
          for (const msg of messagesToRead) {
            await prisma.message_receipts.upsert({
              where: {
                message_id_user_id: {
                  message_id: msg.id,
                  user_id: userId
                }
              },
              create: {
                message_id: msg.id,
                user_id: userId,
                delivered_at: now,
                seen_at: now
              },
              update: {
                seen_at: now
              }
            });

            await prisma.$executeRawUnsafe(
              `UPDATE message_receipts 
               SET delivered_at = COALESCE(delivered_at, $1), seen_at = $1 
               WHERE message_id = $2 AND user_id = $3`,
              now, msg.id, userId
            );

            updates.push({
              messageId: msg.id,
              conversationId,
              userId,
              deliveredAt: now,
              seenAt: now
            });
          }

          chatNamespace.to(`conversation:${conversationId}`).emit("receipt.updated", updates);
        }

        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`🔌 User disconnected from chat: ${userId} (Socket: ${socket.id})`);

      for (const room of socketRooms) {
        socket.leave(room);
      }
      socketRooms.clear();

      // Decrement active connection count atomically in database
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE presences
           SET active_connections = GREATEST(0, active_connections - 1),
               status = CASE WHEN GREATEST(0, active_connections - 1) = 0 THEN 'OFFLINE' ELSE 'ONLINE' END,
               last_seen_at = CASE WHEN GREATEST(0, active_connections - 1) = 0 THEN now() ELSE last_seen_at END,
               updated_at = now()
           WHERE user_id = $1`,
          userId
        );
      } catch (err) {
        console.error(`❌ Error updating presence on disconnect for ${userId}:`, err);
      }
    });
  });

  console.log("✅ Messaging Socket Gateway started listening on /chat namespace.");
}

export async function stopMessaging(): Promise<void> {
  console.log("🔄 Stopping Messaging Socket Gateway...");
  chatNamespace = null;
}

export function getMessagingHealth() {
  return { status: "healthy", gateway: chatNamespace ? "connected" : "disconnected" };
}

export function emitProfileUpdate(userId: string, profileData: any) {
  if (chatNamespace) {
    chatNamespace.emit('profile.updated', { userId, ...profileData });
  }
}

export function sendNotificationToUser(userId: string, event: string, payload: any) {
  if (chatNamespace) {
    chatNamespace.to(`user:${userId}`).emit(event, payload);
  }
}
