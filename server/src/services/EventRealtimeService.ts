import { MyEventsRealtimeService } from './MyEventsRealtimeService';
import { TicketRealtimeService } from './TicketRealtimeService';
import { NotificationRealtimeService } from './NotificationRealtimeService';

export class EventRealtimeService {
    /**
     * Orchestrates the real-time broadcasts when an event is completed.
     * This relies on the database transaction already being successfully committed.
     * 
     * @param eventId - The ID of the event that was completed
     * @param affectedUserIds - The IDs of all users affected by this completion
     *                         (host, attendees, waitlisted, pending, wishlisted)
     */
    static async handleEventCompleted(eventId: string, affectedUserIds: string[]) {
        try {
            const io = (global as any).fastify?.io?.of('/groups');
            if (!io) return;

            // 1. Emit simple UI events
            // Notify anyone currently looking at the event page
            io.to(`event_${eventId}`).emit('event_completed', {
                eventId,
                status: 'completed',
                completedAt: new Date().toISOString()
            });

            // Notify anyone on the discover feed
            // Use 'discover' room for targeted broadcast instead of global
            io.to('discover').emit('discover_event_removed', { eventId });

            // 2. Process user-specific payloads and notifications for all affected users
            // We use Set to de-duplicate users
            const uniqueUsers = Array.from(new Set(affectedUserIds));

            // The implementation plan mandates ordering: Realtime Payload -> Notification -> Emit
            // The domain specific syncUser methods do this internally. We'll run them in order.
            
            // Generate and emit real-time payloads via domain-specific services
            await Promise.all(uniqueUsers.map(async (userId) => {
                await Promise.all([
                    MyEventsRealtimeService.syncUser(userId).catch(console.error),
                    TicketRealtimeService.syncUser(userId, eventId).catch(console.error)
                ]);
                
                // Finally sync notifications
                await NotificationRealtimeService.syncUser(userId, io).catch(console.error);
            }));

            // Sync scanner for the event
            await TicketRealtimeService.syncScanner(eventId).catch(console.error);

        } catch (error) {
            console.error(`[EventRealtimeService] Failed to broadcast event completion for ${eventId}:`, error);
        }
    }
}
