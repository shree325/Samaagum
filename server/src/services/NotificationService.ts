import prisma from '../config/prisma';
import { R_notification_log } from '../repositories/R_notification_log';
import { R_connections } from '../repositories/R_connections';

const notificationLogRepo = new R_notification_log(prisma);
const connectionsRepo = new R_connections();

export class NotificationService {
  /**
   * Bulk-marks unread 'message_received' notifications as read for a
   * specific conversation, up to and including maxCreatedAt.
   *
   * Delegates database queries to the repository.
   *
   * @param userId          Recipient whose notifications to sync
   * @param conversationId  Conversation that was opened
   * @param maxCreatedAt    Timestamp cap — notifications for messages arriving
   *                        AFTER this moment remain unread (race-condition guard)
   * @returns Number of notification rows updated
   */
  async syncMessageNotifications(
    userId: string,
    conversationId: string,
    maxCreatedAt: Date
  ): Promise<number> {
    return await notificationLogRepo.syncMessageNotifications(
      userId,
      conversationId,
      maxCreatedAt
    );
  }

  /**
   * Returns the total unread notification count for a user.
   * Combines unread notification_log entries and pending connection requests
   * using their respective repositories.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const [unreadNotifs, pendingConn] = await Promise.all([
      notificationLogRepo.countUnread(userId),
      connectionsRepo.countPending(userId),
    ]);
    return unreadNotifs + pendingConn;
  }
}

export const notificationService = new NotificationService();

