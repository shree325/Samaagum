import prisma from '../config/prisma';

export interface TicketAttendee {
    name: string | null;
    email: string | null;
    gender: string | null;
}

export interface TicketTypeSummary {
    id: string;
    name: string;
}

export interface TicketItem {
    ticketId: string;
    ticketCode: string;
    attendee: TicketAttendee;
    bookingId: string;
    ticketType: TicketTypeSummary;
    qrToken: string;
    status: string;
    checkInStatus: string;
    issuedAt: string;
    checkedInAt?: string;
}

export interface TicketPayload {
    version: 1;
    eventId: string;
    tickets: TicketItem[];
    counts: {
        total: number;
        active: number;
        cancelled: number;
        checkedIn: number;
        pending: number;
    };
    generatedAt: string;
}

export interface ScannerPayload {
    version: 1;
    eventId: string;
    counts: {
        checkedIn: number;
        remaining: number;
        cancelled: number;
    };
    lastScanId?: string;
    lastScan?: {
        attendee: TicketAttendee;
        ticketCode: string;
        status: string;
        scannedAt: string;
    };
    generatedAt: string;
}

export class TicketRealtimeService {
    static async buildTicketPayload(userId: string, eventId: string): Promise<TicketPayload> {
        const userTickets = await prisma.tickets.findMany({
            where: { 
                booking_line_items: { bookings: { event_id: eventId, booker_user_id: userId } }
            },
            include: {
                booking_line_items: { include: { ticket_types: true, bookings: true } },
                checkins: { where: { reversed: false }, orderBy: { occurred_at: 'desc' }, take: 1 }
            },
            orderBy: { created_at: 'desc' }
        });

        let active = 0, cancelled = 0, checkedIn = 0, pending = 0;

        const tickets: TicketItem[] = userTickets.map(t => {
            const hasCheckin = t.checkins.length > 0;
            const cStatus = hasCheckin ? 'checked_in' : 'pending';
            
            if (t.status === 'cancelled' || t.status === 'refunded') {
                cancelled++;
            } else if (t.status === 'confirmed') {
                active++;
                if (hasCheckin) checkedIn++;
                else pending++;
            } else {
                pending++;
            }

            return {
                ticketId: t.id,
                ticketCode: t.ticket_code || '',
                attendee: {
                    name: t.attendee_name,
                    email: t.attendee_email,
                    gender: t.attendee_gender
                },
                bookingId: t.booking_line_items.booking_id,
                ticketType: {
                    id: t.booking_line_items.ticket_type_id || '',
                    name: t.booking_line_items.ticket_types?.name || 'General Admission'
                },
                qrToken: t.qr_token,
                status: t.status,
                checkInStatus: cStatus,
                issuedAt: t.created_at.toISOString(),
                checkedInAt: hasCheckin ? t.checkins[0].occurred_at.toISOString() : undefined
            };
        });

        return {
            version: 1,
            eventId,
            tickets,
            counts: {
                total: tickets.length,
                active,
                cancelled,
                checkedIn,
                pending
            },
            generatedAt: new Date().toISOString()
        };
    }

    static async buildScannerPayload(eventId: string): Promise<ScannerPayload> {
        // Group by status for counts
        const statusGroups = await prisma.tickets.groupBy({
            by: ['status'],
            where: { booking_line_items: { bookings: { event_id: eventId } } },
            _count: true
        });

        // Get total valid tickets (issued/reserved)
        let totalActive = 0;
        let cancelled = 0;
        for (const g of statusGroups) {
            if (g.status === 'cancelled' || g.status === 'refunded') {
                cancelled += g._count;
            } else {
                totalActive += g._count;
            }
        }

        // Get checkins count
        const checkedIn = await prisma.checkins.count({
            where: { 
                reversed: false,
                tickets: { booking_line_items: { bookings: { event_id: eventId } } }
            }
        });

        const remaining = Math.max(0, totalActive - checkedIn);

        // Get last scan
        const lastCheckin = await prisma.checkins.findFirst({
            where: { tickets: { booking_line_items: { bookings: { event_id: eventId } } } },
            orderBy: { occurred_at: 'desc' },
            include: { tickets: true }
        });

        let lastScan;
        if (lastCheckin && lastCheckin.tickets) {
            lastScan = {
                attendee: {
                    name: lastCheckin.tickets.attendee_name,
                    email: lastCheckin.tickets.attendee_email,
                    gender: lastCheckin.tickets.attendee_gender
                },
                ticketCode: lastCheckin.tickets.ticket_code || '',
                status: lastCheckin.reversed ? 'reversed' : 'checked_in',
                scannedAt: lastCheckin.occurred_at.toISOString()
            };
        }

        return {
            version: 1,
            eventId,
            counts: {
                checkedIn,
                remaining,
                cancelled
            },
            lastScanId: lastCheckin ? lastCheckin.id : undefined,
            lastScan,
            generatedAt: new Date().toISOString()
        };
    }

    static async syncUser(userId: string, eventId: string): Promise<void> {
        try {
            const io = (global as any).fastify?.io?.of('/groups');
            if (!io) return;
            const payload = await this.buildTicketPayload(userId, eventId);
            io.to(`user_${userId}`).emit('ticket_updated', payload);
        } catch (error) {
            console.error(`Failed to sync tickets for user ${userId} event ${eventId}:`, error);
        }
    }

    static async syncUsers(userIds: string[], eventId: string): Promise<void> {
        if (!userIds || userIds.length === 0) return;
        const unique = [...new Set(userIds)];
        await Promise.all(unique.map(id => this.syncUser(id, eventId)));
    }

    static async syncScanner(eventId: string): Promise<void> {
        try {
            const io = (global as any).fastify?.io?.of('/groups');
            if (!io) return;
            const payload = await this.buildScannerPayload(eventId);
            io.to(`scanner_${eventId}`).emit('scanner_updated', payload);
        } catch (error) {
            console.error(`Failed to sync scanner for event ${eventId}:`, error);
        }
    }
}
