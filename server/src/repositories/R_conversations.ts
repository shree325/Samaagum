import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IConversation, IR_conversations } from './IR_conversations';
import prisma from '../config/prisma';

export class R_conversations extends PostgresBaseRepository<IConversation> implements IR_conversations {
  constructor() {
    super('conversations', 'id');
  }

  async findByUserId(userId: string): Promise<IConversation[]> {
    const query = `SELECT * FROM conversations WHERE created_by = $1`;
    const { rows } = await prisma.query(query, [userId]);
    return rows;
  }

  async findByEventId(eventId: string): Promise<IConversation[]> {
    const query = `SELECT * FROM conversations WHERE event_id = $1`;
    const { rows } = await prisma.query(query, [eventId]);
    return rows;
  }

  async findWithParticipants(conversationIds: string[]): Promise<any[]> {
    return await prisma.conversations.findMany({
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
  }

  async findDMBetweenUsers(user1: string, user2: string): Promise<any> {
    return await prisma.conversations.findFirst({
      where: {
        type: "dm" as any,
        AND: [
          { conversation_participants: { some: { user_id: user1 } } },
          { conversation_participants: { some: { user_id: user2 } } }
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
  }

  async createDM(creatorId: string, targetId: string): Promise<any> {
    return await prisma.conversations.create({
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
  }

  async createGroupConversation(creatorId: string, title: string, participantIds: string[]): Promise<any> {
    const uniqueParticipantIds = Array.from(new Set([creatorId, ...(participantIds || [])]));

    return await prisma.conversations.create({
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
  }

  async updateUpdatedAt(conversationId: string): Promise<void> {
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { updated_at: new Date() }
    });
  }
}
