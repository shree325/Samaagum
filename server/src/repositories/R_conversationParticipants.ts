import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IConversationParticipant, IR_conversationParticipants } from './IR_conversationParticipants';
import pool from '../config/database';

export class R_conversationParticipants extends PostgresBaseRepository<IConversationParticipant> implements IR_conversationParticipants {
  constructor() {
    super('conversation_participants', 'participant_id');
  }

  async findByConversationId(conversationId: string): Promise<IConversationParticipant[]> {
    const query = `SELECT * FROM conversation_participants WHERE conversation_id = $1`;
    const { rows } = await pool.query(query, [conversationId]);
    return rows;
  }

  async findByUserId(userId: string): Promise<IConversationParticipant[]> {
    const query = `SELECT * FROM conversation_participants WHERE user_id = $1`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }
}
