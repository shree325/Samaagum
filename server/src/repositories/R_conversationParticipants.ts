import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IConversationParticipant, IR_conversationParticipants } from './IR_conversationParticipants';
import prisma from '../config/prisma';

export class R_conversationParticipants extends PostgresBaseRepository<IConversationParticipant> implements IR_conversationParticipants {
  constructor() {
    super('conversation_participants', 'id');
  }

  async findByConversationId(conversationId: string): Promise<IConversationParticipant[]> {
    const query = `SELECT * FROM conversation_participants WHERE conversation_id = $1`;
    const { rows } = await prisma.query(query, [conversationId]);
    return rows;
  }

  async findByUserId(userId: string): Promise<IConversationParticipant[]> {
    const query = `SELECT * FROM conversation_participants WHERE user_id = $1`;
    const { rows } = await prisma.query(query, [userId]);
    return rows;
  }

  async findParticipants(userId: string): Promise<any[]> {
    return await prisma.conversation_participants.findMany({
      where: { user_id: userId }
    });
  }

  async findOtherParticipants(conversationId: string, userId: string): Promise<any[]> {
    return await prisma.conversation_participants.findMany({
      where: {
        conversation_id: conversationId,
        user_id: { not: userId }
      },
      select: { user_id: true }
    });
  }
}
