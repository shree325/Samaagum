import prisma from '../config/prisma';
import { sendNotificationToUser } from './messagingSocket';

/**
 * Sends in-app real-time notifications to all registered attendees of events
 * that are starting in approximately 60, 30, or 10 minutes.
 *
 * Uses a polling heartbeat (every minute) with deduplication via notification_log.
 * The template_key encodes both the eventId and the window so each reminder fires
 * at most once per attendee.
 */
export class EventReminderService {

  /** Windows (in minutes) at which to fire reminders */
  private static readonly REMINDER_WINDOWS = [60, 30, 10, 5, 2, 1] as const;

  /**
   * Finds events starting within [windowMin - 1, windowMin + 1] minutes,
   * then notifies every registered (confirmed / approved) attendee who hasn't
   * already received that reminder.
   */
  static async checkUpcomingEvents(): Promise<void> {
    const now = new Date();

    for (const windowMin of this.REMINDER_WINDOWS) {
      const windowStart = new Date(now.getTime() + (windowMin - 1) * 60 * 1000);
      const windowEnd   = new Date(now.getTime() + (windowMin + 1) * 60 * 1000);

      // Find published events starting inside the 2-minute window
      const events = await prisma.events.findMany({
        where: {
          status: 'published',
          starts_at: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
        select: {
          id: true,
          title: true,
          starts_at: true,
          tenant_id: true,
        },
      });

      for (const event of events) {
        const templateKey = `event_reminder_${windowMin}min_${event.id}`;

        // Load confirmed attendees (bookings with status confirmed/approved)
        const bookings = await prisma.bookings.findMany({
          where: {
            event_id: event.id,
            status: { in: ['confirmed', 'pending_approval'] },
          },
          select: {
            booker_user_id: true,
            tenant_id: true,
          },
        });

        const userIds = [
          ...new Set(
            bookings
              .map(b => b.booker_user_id)
              .filter((id): id is string => !!id)
          ),
        ];

        if (userIds.length === 0) continue;

        for (const userId of userIds) {
          // Deduplication: skip if already sent this reminder for this user+event+window
          const existing = await prisma.notification_log.findFirst({
            where: {
              user_id: userId,
              template_key: templateKey,
            },
          });

          if (existing) continue;

          const label =
            windowMin === 60 ? '1 hour'
            : windowMin === 30 ? '30 minutes'
            : windowMin === 10 ? '10 minutes'
            : windowMin === 5  ? '5 minutes'
            : windowMin === 2  ? '2 minutes'
            : '1 minute';

          const text = `⏰ <b>${event.title}</b> starts in <b>${label}</b>!`;

          // Write dedup record first (prevent double-send if the loop runs again)
          try {
            await prisma.notification_log.create({
              data: {
                tenant_id: event.tenant_id || '00000000-0000-0000-0000-000000000000',
                user_id: userId,
                channel: 'socket',
                template_key: templateKey,
                provider_ref: event.id,
                status: 'sent',
              },
            });
          } catch (dedupErr: any) {
            // Race condition: another process already wrote it, skip
            if (dedupErr?.code === 'P2002') continue;
            throw dedupErr;
          }

          // Emit real-time socket notification
          sendNotificationToUser(userId, 'group.notification', {
            type: 'event',
            text,
            eventId: event.id,
            eventTitle: event.title,
            reminderMin: windowMin,
          });

          console.log(
            `[EventReminderService] Sent ${windowMin}min reminder for "${event.title}" → user ${userId}`
          );
        }
      }
    }
  }

  /**
   * Starts the background polling loop.
   * Runs every 60 seconds to catch each reminder window with ±1 min tolerance.
   */
  static startScheduler(): void {
    // Initial run after 15 seconds (let server finish booting)
    setTimeout(() => {
      this.checkUpcomingEvents().catch(console.error);
    }, 15_000);

    // Poll every minute
    setInterval(() => {
      this.checkUpcomingEvents().catch(console.error);
    }, 60 * 1000);

    console.log('📅 Event Reminder Scheduler initialized (polls every 60s for 60/30/10/5/2/1-min reminders)');
  }
}
