import prisma from '../config/prisma';
import { EventService } from './EventService';

export class HoldExpirationScheduler {
  static async checkExpiredHolds(): Promise<void> {
    try {
      const now = new Date();

      // Find all bookings with status 'pending_payment' whose hold has expired
      const expiredBookings = await prisma.bookings.findMany({
        where: {
          status: 'pending_payment',
          hold_expires_at: {
            lte: now
          }
        },
        include: {
          events: true,
          booking_line_items: {
            include: {
              tickets: true
            }
          }
        }
      });

      if (expiredBookings.length === 0) {
        return;
      }

      console.log(`[HoldExpirationScheduler] Found ${expiredBookings.length} expired holds.`);

      for (const booking of expiredBookings) {
        try {
          // Resolve changed_by user ID (owner of the host entity)
          let changedByUserId: string | null = null;
          if (booking.events?.hosted_by_entity_id) {
            const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
              `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
              booking.events.hosted_by_entity_id
            );
            changedByUserId = entityRows[0]?.user_id || null;
          }

          // If no owner found, fallback to the booker_user_id
          if (!changedByUserId) {
            changedByUserId = booking.booker_user_id;
          }

          await prisma.$transaction(async (tx) => {
            // Update booking status
            await tx.bookings.update({
              where: { id: booking.id },
              data: { status: 'expired' }
            });

            // Cancel tickets
            for (const lineItem of booking.booking_line_items) {
              for (const ticket of lineItem.tickets) {
                await tx.tickets.update({
                  where: { id: ticket.id },
                  data: { status: 'cancelled' }
                });
              }
            }

            // Insert into event_registration_log
            await tx.$executeRawUnsafe(
              `INSERT INTO event_registration_log (event_id, changed_by, action, booking_id, remarks)
               VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5)`,
              booking.event_id,
              changedByUserId,
              'status_changed_to_expired',
              booking.id,
              'Booking payment hold expired after hold duration window'
            );
          });

          // Trigger waitlist reconciliation to promote any waitlisted attendees
          await EventService.reconcileWaitlist(booking.event_id);

          console.log(`[HoldExpirationScheduler] Successfully expired hold for booking ${booking.id}`);
        } catch (bookingErr) {
          console.error(`[HoldExpirationScheduler] Failed to process expired hold for booking ${booking.id}:`, bookingErr);
        }
      }
    } catch (err) {
      console.error('[HoldExpirationScheduler] Error checking expired holds:', err);
    }
  }

  static startScheduler(): void {
    // Initial run after 20 seconds
    setTimeout(() => {
      this.checkExpiredHolds().catch(console.error);
    }, 20_000);

    // Poll every 60 seconds
    setInterval(() => {
      this.checkExpiredHolds().catch(console.error);
    }, 60 * 1000);

    console.log('⏰ Hold Expiration Scheduler initialized (polls every 60s for expired pending_payment bookings)');
  }
}
