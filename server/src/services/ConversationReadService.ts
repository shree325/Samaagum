import { R_messages } from '../repositories/R_messages';
import { notificationService } from './NotificationService';

const messagesRepo = new R_messages();

export interface ReadConversationResult {
  messagesMarkedRead: number;
  notificationsSynced: number;
  unreadCount: number;
  receiptUpdates: {
    messageId: string;
    conversationId: string;
    userId: string;
    deliveredAt: Date;
    seenAt: Date;
  }[];
}

export class ConversationReadService {
  /**
   * Marks all unread messages in a conversation as seen by the given user,
   * synchronizes related message notifications, and returns the new state.
   *
   * Idempotent — if nothing is unread, still returns current count without
   * touching the database (except for the count query).
   *
   * Race-condition safe — we capture maxCreatedAt before writing, so any
   * message arriving mid-operation keeps its notification unread.
   */
  async readConversation(
    userId: string,
    conversationId: string
  ): Promise<ReadConversationResult> {
    const startTime = Date.now();

    // ── 1. Load unread messages ─────────────────────────────────────────────
    const unreadMessages = await messagesRepo.findUnreadMessages(userId, conversationId);

    const receiptUpdates: ReadConversationResult['receiptUpdates'] = [];

    if (unreadMessages.length > 0) {
      // Race-condition guard: only sync notifications for messages that existed
      // before this operation started. Newer messages stay unread.
      const maxCreatedAt = unreadMessages.reduce(
        (max, m) => (m.created_at > max ? m.created_at : max),
        unreadMessages[0].created_at
      );

      const now = new Date();

      // ── 2. Mark message_receipts as read (batch upsert) ───────────────────
      for (const msg of unreadMessages) {
        await messagesRepo.markReceiptAsSeen(userId, msg.id, now);
        receiptUpdates.push({
          messageId:      msg.id,
          conversationId,
          userId,
          deliveredAt:    now,
          seenAt:         now,
        });
      }

      // ── 3. Sync message notifications (single SQL UPDATE...FROM) ──────────
      const notificationsSynced = await notificationService.syncMessageNotifications(
        userId,
        conversationId,
        maxCreatedAt
      );

      // ── 4. Fetch updated unread count ─────────────────────────────────────
      const unreadCount = await notificationService.getUnreadCount(userId);

      const elapsed = Date.now() - startTime;
      console.log(
        `[ConversationReadService] userId=${userId} conversationId=${conversationId} ` +
        `messagesRead=${unreadMessages.length} notifsSynced=${notificationsSynced} ` +
        `newUnreadCount=${unreadCount} elapsed=${elapsed}ms`
      );

      return {
        messagesMarkedRead: unreadMessages.length,
        notificationsSynced,
        unreadCount,
        receiptUpdates,
      };
    }

    // ── No-op path: conversation already fully read ────────────────────────
    const unreadCount = await notificationService.getUnreadCount(userId);
    return { messagesMarkedRead: 0, notificationsSynced: 0, unreadCount, receiptUpdates: [] };
  }
}

export const conversationReadService = new ConversationReadService();

