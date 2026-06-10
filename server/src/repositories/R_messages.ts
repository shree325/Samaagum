import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IMessage, IR_messages } from './IR_messages';
import pool from '../config/database';

export class R_messages extends PostgresBaseRepository<IMessage> implements IR_messages {
  constructor() {
    super('messages', 'message_id');
  }

  async findByConversationId(conversationId: string): Promise<IMessage[]> {
    const query = `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`;
    const { rows } = await pool.query(query, [conversationId]);
    return rows;
  }

  async findBySenderUserId(senderUserId: string): Promise<IMessage[]> {
    const query = `SELECT * FROM messages WHERE sender_user_id = $1`;
    const { rows } = await pool.query(query, [senderUserId]);
    return rows;
  }
}
