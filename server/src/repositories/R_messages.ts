import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IMessage, IR_messages } from './IR_messages';
import prisma from '../config/prisma';

export class R_messages extends PostgresBaseRepository<IMessage> implements IR_messages {
  constructor() {
    super('messages', 'message_id');
  }

  async findByConversationId(conversationId: string): Promise<IMessage[]> {
    const query = `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`;
    const { rows } = await (prisma as any).query(query, [conversationId]);
    return rows;
  }


  async findBySenderUserId(senderUserId: string): Promise<IMessage[]> {
    const query = `SELECT * FROM messages WHERE sender_user_id = $1`;
    const { rows } = await (prisma as any).query(query, [senderUserId]);
    return rows;
  }

  async findUnreadMessages(userId: string, conversationId: string): Promise<{ id: string; created_at: Date }[]> {
    return await prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
        sender_user_id:  { not: userId },
        is_deleted:      false,
        OR: [
          { message_receipts: { none:  { user_id: userId } } },
          { message_receipts: { some:  { user_id: userId, seen_at: null } } },
        ],
      },
      select: { id: true, created_at: true },
    }) as { id: string; created_at: Date }[];
  }

  async markReceiptAsSeen(userId: string, messageId: string, now: Date): Promise<void> {
    await prisma.message_receipts.upsert({
      where:  { message_id_user_id: { message_id: messageId, user_id: userId } },
      create: { message_id: messageId, user_id: userId, delivered_at: now, seen_at: now },
      update: { seen_at: now },
    });

    await (prisma as any).query(
      `UPDATE message_receipts
       SET    delivered_at = COALESCE(delivered_at, $1),
              seen_at      = $1
       WHERE  message_id   = $2::uuid
         AND  user_id      = $3::uuid`,
      [now, messageId, userId]
    );
  }
}

