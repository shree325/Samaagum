import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IConversation, IR_conversations } from './IR_conversations';
import prisma from '../config/prisma';

export class R_conversations extends PostgresBaseRepository<IConversation> implements IR_conversations {
  constructor() {
    super('conversations', 'conversation_id');
  }

  async findByUserId(userId: string): Promise<IConversation[]> {
    const query = `SELECT * FROM conversations WHERE created_by_user_id = $1`;
    const { rows } = await prisma.query(query, [userId]);
    return rows;
  }

  async findByEventId(eventId: string): Promise<IConversation[]> {
    const query = `SELECT * FROM conversations WHERE event_id = $1`;
    const { rows } = await prisma.query(query, [eventId]);
    return rows;
  }
}
