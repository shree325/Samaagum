import prisma from '../config/prisma';
import { EventService } from './EventService';

export interface MyEventsPayload {
    version: number;
    joined: any[];
    pending: any[];
    waitlist: any[];
    wishlist: any[];
    upcoming: any[];
    completed: any[];
    cancelled: any[];
    counts: {
        joined: number;
        pending: number;
        waitlist: number;
        wishlist: number;
        upcoming: number;
        completed: number;
        cancelled: number;
    };
    generatedAt: string;
}

export class MyEventsRealtimeService {
    static async getUserPayload(userId: string): Promise<MyEventsPayload> {
        // Fetch bookings where the user is the booker
        const bookings = await prisma.bookings.findMany({
            where: {
                booker_user_id: userId,
                status: { in: ['confirmed', 'pending_approval', 'pending_payment', 'cancelled', 'waitlisted'] as any }
            },
            include: { events: true },
            orderBy: { created_at: 'desc' }
        });

        // Fetch attendees where the user is just a guest/attendee
        const guestAttendees = await prisma.attendees.findMany({
            where: {
                user_id: userId,
                status: { in: ['pending', 'approved', 'checked_in'] },
                bookings: { status: { not: 'cancelled' } }
            },
            include: { 
                bookings: { include: { events: true } },
                tickets: true 
            },
            orderBy: { created_at: 'desc' }
        });

        // Fetch assignments where user is a team member
        const assignments = await prisma.event_team_assignments.findMany({
            where: { user_id: userId, state: 'active' },
            include: { events: true },
            orderBy: { created_at: 'desc' }
        });

        // Fetch wishlist items
        const wishlistItems = await prisma.event_wishlist.findMany({
            where: { user_id: userId },
            include: { events: true },
            orderBy: { created_at: 'desc' }
        });

        // Deduplicate by event_id (keep latest booking per event)
        const allEventIds = Array.from(new Set([
            ...bookings.map(b => b.event_id),
            ...guestAttendees.map(a => a.bookings?.event_id).filter(Boolean) as string[],
            ...assignments.map(a => a.event_id),
            ...wishlistItems.map(w => w.event_id)
        ]));

        if (allEventIds.length === 0) {
            return {
                version: 1,
                joined: [], pending: [], waitlist: [], wishlist: [],
                upcoming: [], completed: [], cancelled: [],
                counts: { joined: 0, pending: 0, waitlist: 0, wishlist: 0, upcoming: 0, completed: 0, cancelled: 0 },
                generatedAt: new Date().toISOString()
            };
        }

        // 1. Bulk fetch ticket types
        const ticketsRaw = await prisma.ticket_types.findMany({
            where: { event_id: { in: allEventIds } }
        });
        const ticketsByEvent = ticketsRaw.reduce((acc, t) => {
            if (!acc[t.event_id]) acc[t.event_id] = [];
            acc[t.event_id].push({
                ...t,
                price_minor: t.price_amount_minor !== null && t.price_amount_minor !== undefined ? Number(t.price_amount_minor) : 0,
                price_amount_minor: t.price_amount_minor !== null && t.price_amount_minor !== undefined ? Number(t.price_amount_minor) : null,
                early_bird_price_minor: t.early_bird_price_amount_minor !== null && t.early_bird_price_amount_minor !== undefined ? Number(t.early_bird_price_amount_minor) : null,
                early_bird_price_amount_minor: t.early_bird_price_amount_minor !== null && t.early_bird_price_amount_minor !== undefined ? Number(t.early_bird_price_amount_minor) : null
            });
            return acc;
        }, {} as Record<string, any[]>);

        // 2. Bulk fetch attendees for user's bookings
        const bookingIds = bookings.map(b => b.id);
        const attendeesRaw = bookingIds.length > 0 ? await prisma.attendees.findMany({
            where: { booking_id: { in: bookingIds }, user_id: userId },
            include: { tickets: true }
        }) : [];
        const attendeesByBooking = attendeesRaw.reduce((acc, a) => {
            acc[a.booking_id] = a;
            return acc;
        }, {} as Record<string, any>);

        // 3. Bulk fetch wishlist counts
        const wishlistCountsRaw = await prisma.event_wishlist.groupBy({
            by: ['event_id'],
            where: { event_id: { in: allEventIds } },
            _count: { event_id: true }
        });
        const wishlistCountsByEvent = wishlistCountsRaw.reduce((acc, w) => {
            acc[w.event_id] = w._count.event_id;
            return acc;
        }, {} as Record<string, number>);

        const userWishlistSet = new Set(wishlistItems.map(w => w.event_id));

        // 4. Bulk fetch waitlist positions (only for waitlisted bookings)
        const waitlistedBookings = bookings.filter(b => b.status === ('waitlisted' as any));
        const waitlistStatuses = await Promise.all(waitlistedBookings.map(async b => {
            const ws = await EventService.getWaitlistStatus(b.event_id, userId);
            return { event_id: b.event_id, ...ws };
        }));
        const waitlistByEvent = waitlistStatuses.reduce((acc, ws) => {
            acc[ws.event_id] = ws;
            return acc;
        }, {} as Record<string, any>);

        // 5. In-memory mapping
        const seen = new Set<string>();
        const allEvents: any[] = [];

        const processEventSync = (eventId: string, event: any, bookingStatus: string | null, bookingId: string | null, source: string) => {
            if (seen.has(eventId)) return;
            if (!event) return;
            seen.add(eventId);

            const tickets = ticketsByEvent[eventId] || [];
            
            let attendeeId = null, ticketId = null, qrToken = null, checkinStatus = null;
            if (source === 'guest_attendee' && attendeesByBooking[eventId]) {
                const a = attendeesByBooking[eventId];
                attendeeId = a.id;
                ticketId = a.ticket_id;
                qrToken = a.tickets?.qr_token || null;
                checkinStatus = a.checkin_status;
            } else if (bookingId && attendeesByBooking[bookingId]) {
                const a = attendeesByBooking[bookingId];
                attendeeId = a.id;
                ticketId = a.ticket_id;
                qrToken = a.tickets?.qr_token || null;
                checkinStatus = a.checkin_status;
            }

            const wishlistCount = wishlistCountsByEvent[eventId] || 0;
            const isWishlisted = userWishlistSet.has(eventId);

            let waitlistPosition = null, totalWaiting = null;
            if (bookingStatus === 'waitlisted' && waitlistByEvent[eventId]) {
                waitlistPosition = waitlistByEvent[eventId].position;
                totalWaiting = waitlistByEvent[eventId].totalWaiting;
            }

            allEvents.push({
                ...event,
                tickets,
                bookingStatus,
                bookingId,
                attendeeId,
                ticketId,
                qrToken,
                checkinStatus,
                wishlistCount,
                isWishlisted,
                waitlistPosition,
                totalWaiting,
                _source: source
            });
        };

        bookings.forEach(b => processEventSync(b.event_id, (b as any).events, b.status, b.id, 'booking'));
        guestAttendees.forEach(a => {
            if (a.bookings?.events) {
                // Map native attendee status directly
                const mappedStatus = 
                    a.status === 'pending' ? 'pending_approval' :
                    a.status === 'approved' ? 'confirmed' :
                    a.status === 'checked_in' ? 'confirmed' :
                    a.status === 'rejected' ? 'cancelled' :
                    a.bookings.status; // fallback

                // We store the attendee in attendeesByBooking keyed by eventId as a hack to reuse it
                attendeesByBooking[a.bookings.event_id] = a;
                processEventSync(a.bookings.event_id, a.bookings.events, mappedStatus, a.booking_id, 'guest_attendee');
            }
        });
        assignments.forEach(a => processEventSync(a.event_id, (a as any).events, 'confirmed', null, 'assignment'));
        wishlistItems.forEach(w => processEventSync(w.event_id, (w as any).events, null, null, 'wishlist'));

        const payload: MyEventsPayload = {
            version: 1,
            joined: [],
            pending: [],
            waitlist: [],
            wishlist: [],
            upcoming: [],
            completed: [],
            cancelled: [],
            counts: { joined: 0, pending: 0, waitlist: 0, wishlist: 0, upcoming: 0, completed: 0, cancelled: 0 },
            generatedAt: new Date().toISOString()
        };

        for (const ev of allEvents) {
            if (ev.isWishlisted) {
                payload.wishlist.push(ev);
            }

            if (ev.bookingStatus === 'waitlisted') {
                payload.waitlist.push(ev);
            } else if (ev.bookingStatus === 'pending_approval') {
                payload.pending.push(ev);
            } else if (ev.bookingStatus === 'confirmed' || ev.bookingStatus === 'pending_payment') {
                if (ev.status === 'completed') {
                    payload.completed.push(ev);
                } else if (ev.status === 'cancelled') {
                    payload.cancelled.push(ev);
                } else {
                    payload.upcoming.push(ev);
                }
                payload.joined.push(ev);
            } else if (ev.bookingStatus === 'cancelled') {
                payload.cancelled.push(ev);
            }
        }

        payload.upcoming.sort((a, b) => new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime());
        payload.completed.sort((a, b) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime());
        payload.cancelled.sort((a, b) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime());
        payload.wishlist.sort((a, b) => new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime());
        payload.waitlist.sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));
        payload.pending.sort((a, b) => new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime());
        payload.joined.sort((a, b) => new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime());

        payload.counts = {
            joined: payload.joined.length,
            pending: payload.pending.length,
            waitlist: payload.waitlist.length,
            wishlist: payload.wishlist.length,
            upcoming: payload.upcoming.length,
            completed: payload.completed.length,
            cancelled: payload.cancelled.length
        };

        return payload;
    }

    static async syncUser(userId: string) {
        try {
            const payload = await this.getUserPayload(userId);
            const io = (global as any).fastify?.io?.of('/groups');
            if (io) {
                io.to(`user_${userId}`).emit('my_events_updated', { data: payload });
            }
        } catch (e) {
            console.error('Failed to sync user events', e);
        }
    }

    static async syncUsers(userIds: string[]) {
        try {
            const uniqueUsers = Array.from(new Set(userIds));
            await Promise.all(uniqueUsers.map(id => this.syncUser(id)));
        } catch (e) {
            console.error('Failed to batch sync users', e);
        }
    }
}
