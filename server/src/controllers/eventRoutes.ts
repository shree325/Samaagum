import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { EventService } from '../services/EventService';
import { EventInvitationService } from '../services/EventInvitationService';
import { TicketRealtimeService } from '../services/TicketRealtimeService';
import { TicketNotificationService } from '../services/TicketNotificationService';
import { EventExportController } from '../controllers/EventExportController';
import prisma from '../config/prisma';
import QRCode from 'qrcode';
import { sendEmail, generateTicketHtml, formatCurrency } from '../utils/email';
import { notificationService } from '../services/NotificationService';

// Best-effort JWT decode for routes that are public but want to personalize the response
// (e.g. visibility gating, booking status) when a caller happens to be logged in.
// This app has no @fastify/jwt plugin registered - `authenticate` in index.ts just
// base64-decodes the payload without verifying the signature, so mirror that here.
function tryDecodeUserId(fastify: any, request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
    try {
        const token = authHeader.substring(7);
        const parts = token.split('.');
        if (parts.length !== 3) return undefined;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const uid = payload?.id;
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uid && UUID_REGEX.test(uid)) {
            return uid;
        }
        return undefined;
    } catch {
        return undefined;
    }
}

export const eventRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    // GET /available-roles
    fastify.get('/available-roles', { preHandler: [(fastify as any).optionalAuthenticate] }, async (request: any, reply) => {
        try {
            const roles = await EventService.getAvailableEventRoles();
            return reply.send({ success: true, data: roles });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /scanner-events - events the current user can scan tickets for (any active
    // team role carrying the checkin.gate_staff capability, e.g. ticket_scanner).
    fastify.get('/scanner-events', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const events = await EventService.getScannerEvents(request.user.id);
            return reply.send({ success: true, data: events });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /qr/:token - real scannable QR code image for a ticket's qr_token.
    // No auth required: an <img> tag can't send an Authorization header, and the
    // token itself is an opaque random UUID that only the ticket holder / event
    // admins already have access to, so rendering it as an image leaks nothing new.
    fastify.get('/qr/:token', async (request: any, reply) => {
        try {
            const { token } = request.params;
            if (!token) return reply.status(400).send({ success: false, message: 'token is required' });
            const buffer = await QRCode.toBuffer(String(token), {
                type: 'png',
                width: 320,
                margin: 1,
                errorCorrectionLevel: 'M'
            });
            reply.header('Content-Type', 'image/png');
            reply.header('Cache-Control', 'public, max-age=31536000, immutable');
            return reply.send(buffer);
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });


    // POST /
    fastify.post('', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            if (!request.body.title) {
                return reply.status(400).send({ success: false, message: 'Title is required' });
            }
            const data = await EventService.createEvent(request.user.id, request.user.tenantId, request.body);
            
            const { VirtualMeetingService } = require('../services/VirtualMeetingService');
            let virtualMeetingData = null;
            if (request.body.virtual_provider && request.body.virtual_provider !== 'none') {
                try {
                    const meeting = await VirtualMeetingService.createMeeting(
                        request.body.virtual_provider, 
                        request.user.id, 
                        data.event.id, 
                        data
                    );
                    await prisma.events.update({
                        where: { id: data.event.id },
                        data: { online_link: meeting.joinUrl }
                    });
                    data.event.online_link = meeting.joinUrl;
                    virtualMeetingData = {
                        provider: meeting.provider,
                        meetingId: meeting.meetingId,
                        joinUrl: meeting.joinUrl,
                        hostUrl: meeting.hostUrl,
                        canRegenerate: true
                    };
                } catch (e: any) {
                    console.error('Failed to create virtual meeting on event creation', e);
                }
            }

            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'create' });
            }
            return reply.status(201).send({ success: true, data: { ...data, virtualMeeting: virtualMeetingData }, message: 'Event created successfully' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /my
    fastify.get('/my', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const data = await EventService.getUserEvents(request.user.id);
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/wishlist
    fastify.post('/:id/wishlist', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const data = await EventService.toggleWishlist(request.params.id, request.user.id);
            const { MyEventsRealtimeService } = require('../services/MyEventsRealtimeService');
            MyEventsRealtimeService.syncUser(request.user.id).catch(() => {});
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/registration
    fastify.patch('/:id/registration', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { status, opensAt, closesAt } = request.body;
            if (!status) return reply.status(400).send({ success: false, message: 'status is required' });
            
            const data = await EventService.updateRegistrationSettings(
                request.params.id,
                request.user.id,
                { status, opensAt, closesAt }
            );
            
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${request.params.id}`).emit('dashboard_updated', { action: 'update', eventId: request.params.id });
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'update', eventId: request.params.id });
                (fastify as any).io.of('/groups').to(`event_${request.params.id}`).emit('capacity_updated', { eventId: request.params.id });
            }
            
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /my/wishlist
    fastify.get('/my/wishlist', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const data = await EventService.getWishlistEvents(request.user.id);
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /joined - events the user has joined or requested to join
    fastify.get('/joined', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const userId = request.user.id;

            // Fetch bookings with their related events in a single query
            // Include 'cancelled' so the client can show them under the Archived tab
            const bookings = await prisma.bookings.findMany({
                where: {
                    booker_user_id: userId,
                    status: { in: ['confirmed', 'pending_approval', 'pending_payment', 'cancelled', 'waitlisted'] as any },
                    attendees: {
                        some: {
                            user_id: userId,
                            status: { not: 'rejected' }
                        }
                    }
                },
                include: {
                    events: true
                },
                orderBy: { created_at: 'desc' }
            });

            // Fetch assignments where user is a team member
            const assignments = await prisma.event_team_assignments.findMany({
                where: { user_id: userId, state: 'active' },
                include: { events: true },
                orderBy: { created_at: 'desc' }
            });

            // Fetch attendee records for tickets claimed by this user (OTP claim flow)
            // These are tickets where attendees.user_id = userId but the booking belongs to someone else
            const claimedAttendees = await (prisma.attendees as any).findMany({
                where: { 
                    user_id: userId,
                    status: { in: ['pending', 'approved', 'checked_in'] }
                },
                include: {
                    bookings: {
                        include: { events: true }
                    },
                    tickets: true
                },
                orderBy: { created_at: 'desc' }
            }) as Array<any>;

            // Deduplicate by event_id (keep latest booking per event)
            const seen = new Set<string>();
            const results: any[] = [];

            const processEvent = async (eventId: string, event: any, bookingStatus: string, bookingId: string | null) => {
                if (seen.has(eventId)) return;
                seen.add(eventId);

                if (!event) return;
                // Allow cancelled events through — the client classifies them as Archived

                // Fetch ticket types for this event
                const ticketsRaw = await prisma.ticket_types.findMany({
                    where: { event_id: eventId }
                });

                const tickets = ticketsRaw.map((t: any) => ({
                    ...t,
                    price_minor: t.price_amount_minor !== null && t.price_amount_minor !== undefined ? Number(t.price_amount_minor) : 0,
                    price_amount_minor: t.price_amount_minor !== null && t.price_amount_minor !== undefined ? Number(t.price_amount_minor) : null,
                    early_bird_price_minor: t.early_bird_price_amount_minor !== null && t.early_bird_price_amount_minor !== undefined ? Number(t.early_bird_price_amount_minor) : null,
                    early_bird_price_amount_minor: t.early_bird_price_amount_minor !== null && t.early_bird_price_amount_minor !== undefined ? Number(t.early_bird_price_amount_minor) : null
                }));

                // Fetch this user's own attendee row (real ticket + verification token) for this booking
                let attendeeId: string | null = null;
                let ticketId: string | null = null;
                let qrToken: string | null = null;
                let checkinStatus: string | null = null;
                let bookedTicketName: string | null = null;
                let bookingQty = 1;
                let bookingTotalMinor = 0;
                let bookingCurrency = 'INR';
                let allAttendees: any[] = [];
                if (bookingId) {
                    const bookingObj = bookings.find(b => b.id === bookingId);
                    if (bookingObj) {
                        bookingTotalMinor = bookingObj.total_amount_minor ? Number(bookingObj.total_amount_minor) : 0;
                        bookingCurrency = bookingObj.total_currency || 'INR';
                    }

                    const myAttendee = await prisma.attendees.findFirst({
                        where: { booking_id: bookingId, user_id: userId },
                        include: { tickets: true }
                    });
                    if (myAttendee) {
                        attendeeId = myAttendee.id;
                        ticketId = myAttendee.ticket_id;
                        qrToken = myAttendee.tickets?.qr_token || null;
                        checkinStatus = myAttendee.checkin_status;
                    }

                    // Fetch all attendees for this booking to show order details to the buyer
                    allAttendees = await (prisma.attendees as any).findMany({
                        where: { booking_id: bookingId },
                        select: { id: true, name: true, email: true, ticket_id: true, tickets: { select: { qr_token: true } } }
                    }) as Array<any>;
                    
                    const lineItems = await prisma.booking_line_items.findMany({
                        where: { booking_id: bookingId },
                        include: { ticket_types: true }
                    });
                    bookingQty = lineItems.reduce((sum, item) => sum + item.quantity, 0);
                    if (lineItems[0]?.ticket_types) {
                        bookedTicketName = lineItems[0].ticket_types.name;
                    }
                }

                const wishlistCount = await prisma.event_wishlist.count({
                    where: { event_id: eventId }
                });
                const isWishlisted = await prisma.event_wishlist.findUnique({
                    where: { event_id_user_id: { event_id: eventId, user_id: userId } }
                }).then(Boolean);

                let waitlistPosition: number | null = null;
                let totalWaiting: number | null = null;

                if (bookingStatus === 'waitlisted') {
                    const { EventService } = require('../services/EventService');
                    const ws = await EventService.getWaitlistStatus(eventId, userId);
                    waitlistPosition = ws.position;
                    totalWaiting = ws.totalWaiting;
                }

                results.push({
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
                    bookedTicketName,
                    bookingQty,
                    bookingTotalMinor,
                    bookingCurrency,
                    allAttendees: typeof allAttendees !== 'undefined' ? allAttendees : []
                });
            };

            for (const booking of bookings) {
                await processEvent(booking.event_id, (booking as any).events, booking.status, booking.id);
            }

            for (const assignment of assignments) {
                await processEvent(assignment.event_id, (assignment as any).events, 'confirmed', null);
            }

            // Process claimed-ticket attendees (OTP claim flow — booking belongs to original buyer)
            for (const att of claimedAttendees) {
                const booking = att.bookings as any;
                if (!booking || !booking.event_id) continue;
                if (seen.has(booking.event_id)) continue; // already included via own booking

                const event = booking.events;
                if (!event) continue;

                // Collect the ticket/attendee data directly from this attendee record
                const ticketsRaw = await prisma.ticket_types.findMany({ where: { event_id: booking.event_id } });
                const ticketsMapped = ticketsRaw.map((t: any) => ({
                    ...t,
                    price_minor: t.price_amount_minor != null ? Number(t.price_amount_minor) : 0,
                    price_amount_minor: t.price_amount_minor != null ? Number(t.price_amount_minor) : null,
                    early_bird_price_minor: t.early_bird_price_amount_minor != null ? Number(t.early_bird_price_amount_minor) : null,
                    early_bird_price_amount_minor: t.early_bird_price_amount_minor != null ? Number(t.early_bird_price_amount_minor) : null
                }));

                const wishlistCount = await prisma.event_wishlist.count({ where: { event_id: booking.event_id } });
                const isWishlisted = await prisma.event_wishlist.findUnique({
                    where: { event_id_user_id: { event_id: booking.event_id, user_id: userId } }
                }).then(Boolean);

                seen.add(booking.event_id);
                results.push({
                    ...event,
                    tickets: ticketsMapped,
                    bookingStatus: 'confirmed',
                    bookingId: booking.id,
                    attendeeId: att.id,
                    ticketId: att.ticket_id,
                    qrToken: (att as any).tickets?.qr_token || null,
                    checkinStatus: att.checkin_status,
                    wishlistCount,
                    isWishlisted,
                    waitlistPosition: null,
                    totalWaiting: null,
                    bookedTicketName: (att as any).tickets?.attendee_name || null,
                    bookingQty: 1,
                    bookingTotalMinor: booking.total_amount_minor ? Number(booking.total_amount_minor) : 0,
                    bookingCurrency: booking.total_currency || 'INR'
                });
            }

            return reply.send({ success: true, data: results });
        } catch (e: any) {
            fastify.log.error(e, 'GET /events/joined failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/waitlist
fastify.get('/:id/waitlist', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
        const { id } = request.params as any;
        const data = await EventService.getWaitlist(id);
        return reply.send({ success: true, data });
    } catch (e: any) {
        return reply.status(500).send({ success: false, message: e.message });
    }
});

// GET /:id/waitlist/status
fastify.get('/:id/waitlist/status', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
        const { id } = request.params as any;
        const userId = request.user.id;
        const data = await EventService.getWaitlistStatus(id, userId);
        return reply.send({ success: true, data });
    } catch (e: any) {
        return reply.status(500).send({ success: false, message: e.message });
    }
});

// DELETE /:id/waitlist
fastify.delete('/:id/waitlist', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
        const { id } = request.params as any;
        const userId = request.user.id;
        await EventService.leaveWaitlist(id, userId);

        // Sync user events and waitlist in real-time
        const { MyEventsRealtimeService } = require('../services/MyEventsRealtimeService');
        await MyEventsRealtimeService.syncUser(userId).catch(() => {});

        const groupsNamespace = (fastify as any).io?.of('/groups');
        if (groupsNamespace) {
            groupsNamespace.to(`event_${id}`).emit('waitlist_updated', { eventId: id });
        }

        return reply.send({ success: true, message: 'Left waitlist' });
    } catch (e: any) {
        return reply.status(500).send({ success: false, message: e.message });
    }
});

// POST /:id/waitlist/:userId/approve
fastify.post('/:id/waitlist/:userId/approve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
        const { id, userId: targetUserId } = request.params as any;
        const approverUserId = request.user.id;
        await EventService.approveWaitlistedUser(id, targetUserId, approverUserId);
        return reply.send({ success: true, message: 'User approved from waitlist' });
    } catch (e: any) {
        const status = e.message?.startsWith('Forbidden') ? 403 : 500;
        return reply.status(status).send({ success: false, message: e.message });
    }
});

// GET /
    fastify.get('', async (request: any, reply) => {
        try {
            const tenantId = request.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
            const userId = tryDecodeUserId(fastify, request);
            const cityQuery = (request.query as any)?.city as string | undefined;
            const data = await EventService.getPublicEvents(tenantId as string, userId, cityQuery);
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id
    // Optional ?inviteToken= query param: a valid 'view' or 'join' invite link bypasses the
    // 'unlisted'/'custom' visibility gate for this single request. 'view' links are reusable
    // and are never consumed here; 'join' links are only consumed on actual request-join
    // (see messagingRoutes.ts), not merely by viewing the event.
    fastify.get('/:id', async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const { inviteToken } = request.query as any;
            const userId = tryDecodeUserId(fastify, request);

            let viaInviteLink = false;
            if (inviteToken) {
                const validation = await EventInvitationService.validateToken(inviteToken);
                if (validation.valid && validation.invite?.event_id === id) {
                    viaInviteLink = true;
                }
            }

            const data = await EventService.getEventById(id, userId, viaInviteLink);
            if (!data) {
                return reply.status(404).send({ success: false, message: 'Event not found' });
            }
            if ((data as any).restricted) {
                return reply.status(403).send({ success: false, message: 'You do not have access to this event' });
            }

            let bookingStatus = null;
            let bookingId = null;
            let paymentProofUrl = null;
            let attendeeId = null;
            let ticketId = null;
            let qrToken = null;
            let checkinStatus = null;
            let holdExpiresAt = null;
            if (userId) {
                let booking = await prisma.bookings.findFirst({
                    where: {
                        event_id: id,
                        booker_user_id: userId
                    },
                    orderBy: { created_at: 'desc' }
                });

                let myAttendee = await prisma.attendees.findFirst({
                    where: { bookings: { event_id: id }, user_id: userId },
                    include: { tickets: true, bookings: true },
                    orderBy: { created_at: 'desc' }
                });

                if (myAttendee && !booking) {
                    booking = myAttendee.bookings;
                }

                if (booking) {
                    bookingId = booking.id;
                    paymentProofUrl = booking.payment_proof_url || null;
                    holdExpiresAt = booking.hold_expires_at || null;
                    
                    if (!myAttendee) {
                        myAttendee = await prisma.attendees.findFirst({
                            where: { booking_id: booking.id, user_id: userId },
                            include: { tickets: true, bookings: true }
                        });
                    }
                    
                    if (myAttendee) {
                        const myAttendeeAny = myAttendee as any;
                        attendeeId = myAttendeeAny.id;
                        ticketId = myAttendeeAny.ticket_id;
                        qrToken = myAttendeeAny.tickets?.qr_token || null;
                        checkinStatus = myAttendeeAny.checkin_status;
                        
                        // Map attendee status back to legacy booking status for the UI
                        bookingStatus = myAttendeeAny.status === 'pending' ? 'pending_approval' : 
                                        myAttendeeAny.status === 'approved' ? (booking.status === 'pending_payment' ? 'pending_payment' : 'confirmed') :
                                        myAttendeeAny.status === 'rejected' ? 'cancelled' :
                                        myAttendeeAny.status === 'checked_in' ? 'confirmed' :
                                        myAttendeeAny.status === 'waitlisted' ? 'waitlisted' :
                                        booking.status;
                    } else {
                        bookingStatus = booking.status;
                    }
                }
            }

            const confirmedAttendees = await prisma.attendees.findMany({
                where: { bookings: { event_id: id, status: { in: ['confirmed', 'pending_payment'] } } },
                include: {
                    users_attendees_user_idTousers: {
                        include: {
                            profiles: true
                        }
                    }
                }
            });
            const attendeeDetails = confirmedAttendees.map(a => {
                const user = a.users_attendees_user_idTousers;
                const profile = user?.profiles;
                let picture = null;
                if (profile?.profile_image_data) {
                    picture = `data:image/png;base64,${Buffer.from(profile.profile_image_data).toString('base64')}`;
                }
                return {
                    id: a.user_id,
                    name: a.name,
                    picture: picture
                };
            });

            // Resolve the entity owner to expose created_by on the event
            let ownerUserId: string | null = null;
            if (data.event?.hosted_by_entity_id) {
                const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
                    `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
                    data.event.hosted_by_entity_id
                );
                ownerUserId = entityRows[0]?.user_id || null;
            }

            const virtualMeeting = await prisma.event_virtual_meetings.findFirst({ where: { event_id: id }});
            let integration = null;
            if (virtualMeeting) {
                integration = await prisma.user_integrations.findFirst({
                    where: { user_id: ownerUserId || userId, provider: virtualMeeting.provider }
                });
            }
            const virtualMeetingData = virtualMeeting ? {
                provider: virtualMeeting.provider,
                meetingId: virtualMeeting.meeting_id,
                joinUrl: (virtualMeeting.metadata as any)?.join_url,
                hostUrl: (virtualMeeting.metadata as any)?.host_url,
                canRegenerate: !!integration,
                ownershipWarning: integration?.user_id !== (ownerUserId || userId)
            } : null;

            return reply.send({
                success: true,
                data: {
                    ...data,
                    event: {
                        ...data.event,
                        created_by: ownerUserId
                    },
                    bookingStatus,
                    bookingId,
                    paymentProofUrl,
                    holdExpiresAt,
                    attendeeId,
                    ticketId,
                    qrToken,
                    checkinStatus,
                    attendees: attendeeDetails,
                    virtualMeeting: virtualMeetingData
                }
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PUT /:id
    fastify.put('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            
            const { VirtualMeetingService } = require('../services/VirtualMeetingService');
            let updates = request.body;

            if (updates.virtual_provider) {
                const existing = await prisma.event_virtual_meetings.findFirst({ where: { event_id: id }});
                
                if (updates.virtual_provider === 'none') {
                    if (existing) await VirtualMeetingService.deleteMeeting(existing.provider, request.user.id, id);
                    updates.online_link = null;
                } else if (existing && existing.provider !== updates.virtual_provider) {
                    if (!updates.replace_existing) throw new Error('PROVIDER_SWITCH_NOT_CONFIRMED');
                    await VirtualMeetingService.deleteMeeting(existing.provider, request.user.id, id).catch(() => {});
                    const eventData = await EventService.getEventById(id, request.user.id);
                    const meeting = await VirtualMeetingService.createMeeting(updates.virtual_provider, request.user.id, id, { ...eventData?.event, ...updates });
                    updates.online_link = meeting.joinUrl;
                } else if (!existing) {
                    const eventData = await EventService.getEventById(id, request.user.id);
                    const meeting = await VirtualMeetingService.createMeeting(updates.virtual_provider, request.user.id, id, { ...eventData?.event, ...updates });
                    updates.online_link = meeting.joinUrl;
                }
            }

            const data = await EventService.updateEvent(id, request.user.id, updates);
            
            if (updates.starts_at || updates.ends_at) {
                const existing = await prisma.event_virtual_meetings.findFirst({ where: { event_id: id }});
                if (existing) {
                    await VirtualMeetingService.updateMeeting(existing.provider, request.user.id, id, data).catch(() => {});
                }
            }

            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'update', eventId: id });
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('dashboard_updated', { action: 'settings_update', eventId: id });
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('capacity_updated', { eventId: id });
            }
            return reply.send({ success: true, data, message: 'Event updated' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id
    fastify.delete('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            
            const meeting = await prisma.event_virtual_meetings.findFirst({ where: { event_id: id }});
            if (meeting) {
                const { VirtualMeetingService } = require('../services/VirtualMeetingService');
                await VirtualMeetingService.deleteMeeting(meeting.provider, request.user.id, id).catch((err: any) => {
                    console.warn('⚠️ Could not delete provider meeting:', err.message);
                });
            }

            await EventService.deleteEvent(id, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'delete', eventId: id });
            }
            return reply.send({ success: true, message: 'Event deleted' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/publish
    fastify.patch('/:id/publish', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await EventService.publishDraft(id, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'publish', eventId: id });
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('dashboard_updated', { action: 'publish', eventId: id });
            }
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(e.message === 'Forbidden' ? 403 : 500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/archive — set event status to 'cancelled' (archive)
    fastify.patch('/:id/archive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const updated = await EventService.updateEvent(id, request.user.id, { status: 'cancelled' });
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'archive', eventId: id });
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('event_archived', { eventId: id });
            }
            return reply.send({ success: true, data: updated, message: 'Event archived successfully' });
        } catch (e: any) {
            return reply.status(e.message?.includes('Forbidden') ? 403 : 500).send({ success: false, message: e.message });
        }
    });


    fastify.get('/:id/members', { preHandler: [(fastify as any).optionalAuthenticate] }, async (request: any, reply) => {
        try {
            const members = await EventService.getEventMembers((request.params as any).id);
            return reply.send({ success: true, data: members });
        } catch (e: any) {
            fastify.log.error(e, 'GET /events/:id/members failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/memberships/:userId/role
    fastify.patch('/:id/memberships/:userId/role', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { role } = request.body as any;
            const { id, userId } = request.params as any;
            await EventService.updateMemberRole(id, userId, role, request.user.id);
            return reply.send({ success: true, message: 'Role updated successfully' });
        } catch (e: any) {
            fastify.log.error(e, 'PATCH /events/:id/memberships/:userId/role failed');
            const code = e.message.startsWith('Forbidden') ? 403 : 500;
            return reply.status(code).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/memberships/:userId
    fastify.delete('/:id/memberships/:userId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, userId } = request.params as any;
            await EventService.removeMember(id, userId, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('dashboard_updated', { action: 'remove_member', eventId: id, userId });
            }
            return reply.send({ success: true, message: 'Member removed successfully' });
        } catch (e: any) {
            fastify.log.error(e, 'DELETE /events/:id/memberships/:userId failed');
            const code = e.message.startsWith('Forbidden') ? 403 : 500;
            return reply.status(code).send({ success: false, message: e.message });
        }
    });

    // GET /:id/posts
    fastify.get('/:id/posts', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const data = await EventService.getEventPosts(id, request.query, request.user);
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts
    fastify.post('/:id/posts', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const io = (fastify as any).io || null;
            const data = await EventService.createEventPost(id, request.user, request.body, io);
            // Only broadcast new_thread to all if the post is NOT pending approval
            if (!(data as any).pendingApproval && (fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('new_thread', { eventId: id, groupId: id, postId: (data as any).id });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_thread', { eventId: id, groupId: id, postId: (data as any).id });
            }
            return reply.status(201).send({ success: true, data, message: (data as any).pendingApproval ? 'Thread submitted for approval' : 'Post created' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId
    fastify.patch('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            await EventService.editEventPost(id, postId, request.user, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_edited', { eventId: id, groupId: id, postId });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_edited', { eventId: id, groupId: id, postId });
            }
            return { success: true, message: 'Post updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/posts/:postId
    fastify.delete('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            await EventService.deleteEventPost(id, postId, request.user);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_deleted', { eventId: id, groupId: id, postId });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_deleted', { eventId: id, groupId: id, postId });
            }
            return { success: true, message: 'Post deleted' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/approve  — owner/host approves a pending thread
    fastify.patch('/:id/posts/:postId/approve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            await EventService.approveEventPost(id, postId, request.user.id);
            if ((fastify as any).io) {
                // Broadcast new_thread so all clients refresh their feed and see the newly approved thread
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('new_thread', { eventId: id, groupId: id, postId });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_thread', { eventId: id, groupId: id, postId });
                // Also emit post_approved so the discussion panel can remove it from the pending list
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('post_approved', { eventId: id, postId });
            }
            return { success: true, message: 'Thread approved' };
        } catch (e: any) {
            const code = e.message?.startsWith('Forbidden') ? 403 : e.message?.startsWith('Thread') ? 404 : 500;
            return reply.status(code).send({ success: false, message: e.message });
        }
    });

    // GET /:id/posts/:postId
    fastify.get('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id, postId } = request.params as any;
            const data = await EventService.getEventPost(id, postId, request.user);
            if (!data) return reply.status(404).send({ success: false, message: 'Thread not found' });
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/comments
    fastify.post('/:id/posts/:postId/comments', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            if (!request.body.body?.trim()) return reply.status(400).send({ success: false, message: 'Reply cannot be empty' });
            const data = await EventService.createEventComment(id, postId, request.user, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('new_comment', { eventId: id, groupId: id, postId, commentId: (data as any).id });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_comment', { eventId: id, groupId: id, postId, commentId: (data as any).id });
            }
            return reply.status(201).send({ success: true, data, message: 'Reply added' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/comments/:commentId
    fastify.patch('/:id/posts/:postId/comments/:commentId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId, commentId } = request.params as any;
            await EventService.editEventComment(id, postId, commentId, request.user, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('comment_edited', { eventId: id, groupId: id, postId, commentId });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_edited', { eventId: id, groupId: id, postId, commentId });
            }
            return { success: true, message: 'Comment updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/posts/:postId/comments/:commentId
    fastify.delete('/:id/posts/:postId/comments/:commentId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId, commentId } = request.params as any;
            await EventService.deleteEventComment(id, postId, commentId, request.user);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('comment_deleted', { eventId: id, groupId: id, postId, commentId });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_deleted', { eventId: id, groupId: id, postId, commentId });
            }
            return { success: true, message: 'Comment deleted' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/vote
    fastify.post('/:id/posts/:postId/vote', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { vote } = request.body as any;
            const data = await EventService.voteEventPost(id, postId, request.user, vote);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_voted', { eventId: id, groupId: id, postId, score: data.vote_score });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_voted', { eventId: id, groupId: id, postId, score: data.vote_score });
            }
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/comments/:commentId/vote
    fastify.post('/:id/posts/:postId/comments/:commentId/vote', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId, commentId } = request.params as any;
            const { vote } = request.body as any;
            const data = await EventService.voteEventComment(id, commentId, request.user, vote);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('comment_voted', { eventId: id, groupId: id, postId, commentId, score: data.vote_score });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_voted', { eventId: id, groupId: id, postId, commentId, score: data.vote_score });
            }
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/react
    fastify.post('/:id/posts/:postId/react', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { emoji } = request.body as any;
            if (!emoji) return reply.status(400).send({ success: false, message: 'emoji required' });
            const reactions = await EventService.reactEventPost(id, postId, request.user, emoji);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_reacted', { eventId: id, groupId: id, postId, reactions });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_reacted', { eventId: id, groupId: id, postId, reactions });
            }
            return { success: true, data: { reactions } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/solve
    fastify.patch('/:id/posts/:postId/solve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { solved } = request.body as any;
            await EventService.solveEventPost(id, postId, request.user, solved);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_solved', { eventId: id, groupId: id, postId, solved });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_solved', { eventId: id, groupId: id, postId, solved });
            }
            return { success: true, message: solved ? 'Marked as solved' : 'Unmarked as solved' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/archive
    fastify.patch('/:id/posts/:postId/archive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { archived } = request.body as any;
            await EventService.archiveEventPost(id, postId, request.user, archived);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_archived', { eventId: id, groupId: id, postId, archived });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_archived', { eventId: id, groupId: id, postId, archived });
            }
            return { success: true, message: archived ? 'Thread archived' : 'Thread unarchived' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/pin
    fastify.patch('/:id/posts/:postId/pin', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { pinned } = request.body as any;
            await EventService.pinEventPost(id, postId, request.user, pinned);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_pinned', { eventId: id, groupId: id, postId, pinned });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_pinned', { eventId: id, groupId: id, postId, pinned });
            }
            return { success: true, message: pinned ? 'Post pinned' : 'Post unpinned' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/lock
    fastify.patch('/:id/posts/:postId/lock', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { locked } = request.body as any;
            await EventService.lockEventPost(id, postId, request.user, locked);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('thread_locked', { eventId: id, groupId: id, postId, locked });
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_locked', { eventId: id, groupId: id, postId, locked });
            }
            return { success: true, message: locked ? 'Post locked' : 'Post unlocked' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    fastify.get('/:id/export/summary', { preHandler: [(fastify as any).authenticate] }, EventExportController.summary);
    fastify.get('/:id/export', { preHandler: [(fastify as any).authenticate] }, EventExportController.export);

    // GET /:id/dashboard-stats
    fastify.get('/:id/dashboard-stats', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;

            // Verify admin/host permissions
            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const event = await prisma.events.findUnique({ where: { id } });
            if (!event) {
                return reply.status(404).send({ success: false, message: 'Event not found' });
            }

            // Fetch bookings
            const bookings = await prisma.bookings.findMany({
                where: { event_id: id }
            });

            const confirmedAttendees = await prisma.attendees.findMany({
                where: { 
                    bookings: { event_id: id, status: { in: ['confirmed', 'pending_payment'] } },
                    status: { in: ['approved', 'checked_in', 'pending'] }
                },
                include: {
                    tickets: true,
                    bookings: {
                        include: {
                            booking_line_items: {
                                include: {
                                    ticket_types: true
                                }
                            }
                        }
                    },
                    users_attendees_user_idTousers: true
                }
            });

            // Pending join requests
            const pendingRequests = await (prisma.attendees as any).findMany({
                where: { 
                    bookings: { event_id: id },
                    status: 'pending'
                },
                include: {
                    users_attendees_user_idTousers: { select: { profile_image_data: true } },
                    bookings: { select: { payment_proof_url: true, payment_method: true, booker_user_id: true, users: { select: { profiles: true } } } }
                }
            }) as Array<any>;

            const totalRevenueMinor = bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + Number(b.total_amount_minor || 0), 0);

            const checkedInCount = confirmedAttendees.filter(a => a.checkin_status === 'checked_in').length;
            
            const wishlistCount = await prisma.event_wishlist.count({
                where: { event_id: id }
            });

            // Resolve registration locations for confirmed attendees (city-level aggregation)
            const activeCities = await prisma.city_controls.findMany({
                where: { is_active: true }
            });

            const cityMap = new Map<string, Array<{ city_name: string, state_name: string | null, country_name: string | null, latitude: number, longitude: number }>>();
            activeCities.forEach(c => {
                if (c.latitude !== null && c.longitude !== null) {
                    const key = c.city_name.toLowerCase();
                    const entry = {
                        city_name: c.city_name,
                        state_name: c.state_name || null,
                        country_name: c.country_name || null,
                        latitude: Number(c.latitude),
                        longitude: Number(c.longitude)
                    };
                    if (!cityMap.has(key)) {
                        cityMap.set(key, [entry]);
                    } else {
                        cityMap.get(key)!.push(entry);
                    }
                }
            });

            const CITY_ALIASES: Record<string, string> = {
                "bombay": "mumbai",
                "bangalore": "bengaluru",
                "madras": "chennai",
                "calcutta": "kolkata",
                "new delhi": "delhi",
                "gurgaon": "gurugram",
                "poona": "pune"
            };

            let totalMapped = 0;
            let totalUnknown = 0;
            const cityCounts = new Map<string, { city: string, state: string | null, countryCode: string, count: number, lat: number, lng: number }>();

            for (const attendee of confirmedAttendees) {
                let resolved: any = null;

                // 1. Resolve via user profile location
                const rawProfileLoc = attendee.users_attendees_user_idTousers?.location;
                if (rawProfileLoc) {
                    const parts = rawProfileLoc.trim().toLowerCase().split(',').map((p: string) => p.trim());
                    const cleanLoc = parts[0];
                    const normalizedName = CITY_ALIASES[cleanLoc] || cleanLoc;
                    
                    const candidates = cityMap.get(normalizedName);
                    if (candidates && candidates.length > 0) {
                        let matched = candidates[0]; // fallback to first
                        
                        // Try to find a better match using the country/state from rawProfileLoc
                        if (parts.length > 1) {
                            const countryOrState = parts[parts.length - 1]; // usually country
                            const betterMatch = candidates.find(c => 
                                (c.country_name && c.country_name.toLowerCase() === countryOrState) ||
                                (c.state_name && c.state_name.toLowerCase() === countryOrState)
                            );
                            if (betterMatch) {
                                matched = betterMatch;
                            } else {
                                // Default to prioritizing India if ambiguous
                                const indiaMatch = candidates.find(c => c.country_name === 'India');
                                if (indiaMatch) {
                                    matched = indiaMatch;
                                }
                            }
                        } else {
                            // If no country specified in rawProfileLoc, default to prioritizing India
                            const indiaMatch = candidates.find(c => c.country_name === 'India');
                            if (indiaMatch) {
                                matched = indiaMatch;
                            }
                        }
                        
                        resolved = {
                            city: matched.city_name,
                            state: matched.state_name,
                            countryCode: matched.country_name === 'India' ? 'IN' : (matched.country_name || 'IN'),
                            lat: matched.latitude,
                            lng: matched.longitude
                        };
                    }
                }

                // 2. Fallback to derived geolocation stored in attendee notes JSON
                if (!resolved) {
                    let parsedNotes: any = {};
                    try {
                        parsedNotes = JSON.parse(attendee.notes || '{}');
                    } catch (e) {}
                    const regLoc = parsedNotes.registration_location;
                    if (regLoc && regLoc.city && regLoc.lat && regLoc.lng) {
                        resolved = {
                            city: regLoc.city,
                            state: regLoc.state || null,
                            countryCode: regLoc.countryCode || 'IN',
                            lat: Number(regLoc.lat),
                            lng: Number(regLoc.lng)
                        };
                    }
                }

                if (resolved) {
                    totalMapped++;
                    const key = `${resolved.city.toLowerCase()}_${resolved.countryCode.toLowerCase()}`;
                    const existing = cityCounts.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        cityCounts.set(key, {
                            city: resolved.city,
                            state: resolved.state,
                            countryCode: resolved.countryCode,
                            count: 1,
                            lat: resolved.lat,
                            lng: resolved.lng
                        });
                    }
                } else {
                    totalUnknown++;
                }
            }

            // Accurate count via dedicated COUNT (not take:6)
            const waitlistTotalCount = await prisma.bookings.count({
              where: { event_id: id, status: 'waitlisted' }
            });
            const waitlistAll = await EventService.getWaitlist(id);
            const waitlistEnabled = (event.settings as any)?.capacity?.waitlist === true;

            return {
                success: true,
                data: {
                    totalAttendees: confirmedAttendees.length,
                    checkedInCount,
                    pendingRequestsCount: pendingRequests.length,
                    revenue: totalRevenueMinor / 100,
                    capacity: event.capacity_total || 120,
                    wishlistCount,
                    waitlistEnabled,
                    waitlistCount: waitlistTotalCount,
                    waitlist: waitlistAll.slice(0, 5).map((b, idx) => ({
                      id: b.id,
                      userId: b.user?.id || null,
                      name: b.user?.display_name || 'Guest',
                      joinedAt: b.created_at?.toISOString?.() || null,
                      position: idx + 1,
                    })),
                    confirmed: confirmedAttendees.map(a => {
                        let parsedAnswers = {};
                        try {
                            parsedAnswers = JSON.parse(a.notes || '{}');
                            delete (parsedAnswers as any).transactionId;
                            delete (parsedAnswers as any).buyer;
                            delete (parsedAnswers as any).attendees;
                            delete (parsedAnswers as any).registration_location;
                        } catch (e) {}
                        return {
                            id: a.id,
                            userId: a.user_id,
                            bookingId: a.booking_id,
                            name: a.name,
                            email: a.email,
                            checkinStatus: a.checkin_status,
                            ticketId: a.ticket_id,
                            qrToken: (a as any).tickets?.qr_token || null,
                            bookingStatus: (a as any).bookings?.status || 'confirmed',
                            isCashPayment: (a as any).bookings?.payment_method === 'cash',
                            amountMinor: (a as any).bookings?.total_amount_minor ? Number((a as any).bookings.total_amount_minor) : 0,
                            answers: parsedAnswers,
                            ticketTypeName: (a as any).bookings?.booking_line_items?.[0]?.ticket_types?.name || null,
                            createdAt: a.created_at || (a as any).bookings?.created_at || null,
                            checkinTime: a.checkin_status === 'checked_in' ? a.updated_at : null,
                            claimStatus: a.user_id ? 'claimed' : 'claim_pending',
                            transactionId: (a as any).bookings?.payment_proof_url || null
                        };
                    }),
                    requests: pendingRequests.map(r => {
                        let parsedAnswers = {};
                        try {
                            parsedAnswers = JSON.parse(r.notes || '{}');
                            delete (parsedAnswers as any).transactionId;
                            delete (parsedAnswers as any).buyer;
                            delete (parsedAnswers as any).attendees;
                            delete (parsedAnswers as any).registration_location;
                        } catch (e) {}
                        const userPic = (r as any).users_attendees_user_idTousers?.profile_image_data;
                        const picture = userPic ? `data:image/jpeg;base64,${Buffer.from(userPic).toString('base64')}` : null;
                        const bk = (r as any).bookings;
                        const buyerProfile = bk?.users?.profiles;
                        const purchaserName = (Array.isArray(buyerProfile) ? buyerProfile[0]?.display_name : buyerProfile?.display_name) || 'Buyer';
                        return {
                            id: r.id,
                            userId: r.user_id,
                            bookingId: r.booking_id,
                            name: r.name,
                            email: r.email,
                            picture,
                            answers: parsedAnswers,
                            transactionId: bk?.payment_proof_url || null,
                            isCash: bk?.payment_method === 'cash',
                            purchaserName
                        };
                    }),
                    bookings: bookings.map(b => ({
                        id: b.id,
                        status: b.status,
                        createdAt: b.created_at
                    })),
                    cashBookings: (await prisma.bookings.findMany({
                        where: { event_id: id, payment_method: 'cash' },
                        include: {
                            users: { select: { first_name: true, last_name: true, primary_email: true } },
                            booking_line_items: {
                                include: {
                                    ticket_types: { select: { name: true } }
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    })).map(b => ({
                        id: b.id,
                        status: b.status,
                        payment_proof_url: b.payment_proof_url,
                        total_amount_minor: b.total_amount_minor ? Number(b.total_amount_minor) : 0,
                        created_at: b.created_at,
                        hold_expires_at: b.hold_expires_at,
                        users: {
                            display_name: `${(b as any).users?.first_name || ''} ${(b as any).users?.last_name || ''}`.trim() || 'Guest',
                            email: (b as any).users?.primary_email || 'N/A'
                        },
                        booking_line_items: (b as any).booking_line_items.map((li: any) => ({
                            ticket_types: {
                                name: li.ticket_types?.name || 'Ticket'
                            }
                        }))
                    })),
                    auditLogs: await (async () => {
                        const rawLogs = await prisma.event_registration_log.findMany({
                            where: { event_id: id },
                            include: {
                                users: { select: { first_name: true, last_name: true } }
                            },
                            orderBy: { created_at: 'desc' }
                        });
                        const logBookingIds = Array.from(new Set(rawLogs.map(l => l.booking_id).filter(Boolean))) as string[];
                        const logBookings = logBookingIds.length > 0 ? await prisma.bookings.findMany({
                            where: { id: { in: logBookingIds } },
                            include: { users: { select: { first_name: true, last_name: true } } }
                        }) : [];
                        const logBookingsMap = new Map(logBookings.map(b => [b.id, b]));
                        
                        return rawLogs.map(l => {
                            const targetBooking = l.booking_id ? logBookingsMap.get(l.booking_id) : null;
                            const targetUser = targetBooking ? `${(targetBooking as any).users?.first_name || ''} ${(targetBooking as any).users?.last_name || ''}`.trim() : null;
                            return {
                                id: l.id,
                                changedBy: `${(l as any).users?.first_name || ''} ${(l as any).users?.last_name || ''}`.trim() || 'System',
                                targetUser,
                                action: l.action,
                                bookingId: l.booking_id,
                                remarks: l.remarks,
                                createdAt: l.created_at
                            };
                        });
                    })(),
                    locations: {
                        totalMapped,
                        totalUnknown,
                        cities: Array.from(cityCounts.values())
                    }
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/dashboard-waitlist
    fastify.get('/:id/dashboard-waitlist', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;

            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const event = await prisma.events.findUnique({
                where: { id },
                select: { settings: true, capacity_total: true }
            });
            if (!event) return reply.status(404).send({ success: false, message: 'Event not found' });

            const waitlistAll = await EventService.getWaitlist(id);
            const waitlistCount = await prisma.bookings.count({
                where: { event_id: id, status: 'waitlisted' }
            });
            const waitlistEnabled = (event.settings as any)?.capacity?.waitlist === true;

            return reply.send({
                success: true,
                data: {
                    waitlistEnabled,
                    waitlistCount,
                    waitlist: waitlistAll.slice(0, 5).map((b, idx) => ({
                        id: b.id,
                        userId: b.user?.id || null,
                        name: b.user?.display_name || 'Guest',
                        joinedAt: b.created_at?.toISOString?.() || null,
                        position: idx + 1,
                    }))
                }
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/requests/attendees/:attendeeId/action
    fastify.post('/:id/requests/attendees/:attendeeId/action', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, attendeeId } = request.params as any;

            console.log('[DEBUG] Action route called', { eventId: id, attendeeId, action: request.body?.action });

            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) {
                console.log('[DEBUG] Forbidden for user', request.user.id);
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const attendee = await prisma.attendees.findUnique({
                where: { id: attendeeId },
                include: { bookings: true, tickets: true }
            });
            console.log('[DEBUG] Found attendee:', attendee ? { id: attendee.id, booking_event_id: attendee.bookings?.event_id } : 'null');
            
            if (!attendee || attendee.bookings.event_id !== id) {
                console.log('[DEBUG] Returning 404 because:', !attendee ? 'not found in DB' : `event_id mismatch (${attendee.bookings?.event_id} !== ${id})`);
                return reply.status(404).send({ success: false, message: 'Attendee not found' });
            }

            const { action } = request.body as any;
            const booking = attendee.bookings;
            const nextAttendeeStatus = action === 'accept' ? 'approved' : 'rejected';

            // ── Capacity Guard ───────────────────────────────────────────────────────
            // Before approving, check if the event is already at full capacity.
            let shouldMoveRemainingToWaitlist = false;
            if (action === 'accept') {
                const eventForCapacity = await prisma.events.findUnique({
                    where: { id },
                    select: { settings: true }
                });
                const cap = (eventForCapacity?.settings as any)?.capacity || {};
                if (cap.limit === true && cap.max > 0) {
                    // Only count permanently taken spots. This booking is currently pending_approval.
                    const permanentOccupiedCount = await prisma.bookings.count({
                        where: { event_id: id, status: { in: ['confirmed', 'pending_payment'] } }
                    });
                    
                    if (permanentOccupiedCount >= cap.max) {
                        return reply.status(400).send({ success: false, message: 'Event is at full capacity. Cannot approve more requests.' });
                    }
                    
                    // If approving this request will fill the last slot, flag to move remaining to waitlist.
                    if (permanentOccupiedCount + 1 >= cap.max) {
                        shouldMoveRemainingToWaitlist = cap.waitlist === true;
                    }
                }
            }
            // ── End Capacity Guard ───────────────────────────────────────────────────

            await prisma.$transaction(async (tx) => {
                const isCash = booking.payment_method === 'cash';
                const cashAlreadyPaid = isCash && !!booking.payment_proof_url;

                // Update the specific attendee's status
                await (tx.attendees as any).update({
                    where: { id: attendeeId },
                    data: { status: nextAttendeeStatus }
                });

                // Check if all attendees in this booking are approved/rejected
                const allAttendees = await (tx.attendees as any).findMany({
                    where: { booking_id: booking.id }
                }) as Array<any>;
                
                const stillPending = allAttendees.some((a: any) => a.status === 'pending');
                let nextBookingStatus = booking.status;

                if (!stillPending) {
                    const anyApproved = allAttendees.some((a: any) => a.status === 'approved' || a.status === 'checked_in');
                    if (anyApproved) {
                        nextBookingStatus = 'confirmed';
                    } else {
                        nextBookingStatus = 'cancelled'; // All rejected
                    }
                    await tx.bookings.update({
                        where: { id: booking.id },
                        data: { status: nextBookingStatus }
                    });
                }

                // If there's a ticket attached (which there usually is for pending attendees), update its status
                if (attendee.ticket_id) {
                    const nextTicketStatus = action === 'accept' 
                        ? 'confirmed'
                        : 'cancelled';

                    await tx.tickets.update({
                        where: { id: attendee.ticket_id },
                        data: { status: nextTicketStatus }
                    });
                }
            });

            // ── Auto-move remaining pending_approval → waitlisted ────────────────────
            if (shouldMoveRemainingToWaitlist) {
                const remainingPending = await prisma.bookings.findMany({
                    where: {
                        event_id: id,
                        status: 'pending_approval',
                        id: { not: booking.id }
                    },
                    select: { id: true, booker_user_id: true }
                });

                if (remainingPending.length > 0) {
                    const remainingIds = remainingPending.map(b => b.id);

                    // Move bookings to waitlisted
                    await prisma.bookings.updateMany({
                        where: { id: { in: remainingIds } },
                        data: { status: 'waitlisted' }
                    });

                    // Move their attendees to waitlisted status
                    await prisma.attendees.updateMany({
                        where: { booking_id: { in: remainingIds } },
                        data: { status: 'waitlisted' as any }
                    });

                    // Sync real-time for each affected user
                    const { MyEventsRealtimeService } = require('../services/MyEventsRealtimeService');
                    for (const b of remainingPending) {
                        if (b.booker_user_id) {
                            TicketRealtimeService.syncUser(b.booker_user_id, id).catch(() => {});
                            MyEventsRealtimeService.syncUser(b.booker_user_id).catch(() => {});
                        }
                    }

                    // Tell the waitlist logic to broadcast updated position sockets to everyone
                    await EventService.broadcastWaitlistPositions(id).catch(() => {});

                    // Tell the host dashboard to refresh the waitlist widget immediately
                    const groupsNamespace = (fastify as any).io?.of('/groups');
                    if (groupsNamespace) {
                        groupsNamespace.to(`event_${id}`).emit('waitlist_updated', { eventId: id });
                    }
                }
            }
            // ── End Auto-move ────────────────────────────────────────────────────────


            // Write audit log
            const auditAction = action === 'accept' ? 'attendee_approved' : 'attendee_rejected';
            const auditRemark = action === 'accept' ? 'Attendee approved by host' : 'Attendee rejected by host';
            try {
                await prisma.$executeRawUnsafe(
                    `INSERT INTO event_registration_log (event_id, changed_by, action, booking_id, remarks) VALUES ($1, $2, $3, $4, $5)`,
                    id,
                    request.user.id,
                    auditAction,
                    booking.id,
                    auditRemark
                );
            } catch (logErr: any) {
                console.error('[eventRoutes] Failed to write audit log:', logErr.message);
            }

            const guestId = booking.booker_user_id;
            const event = await prisma.events.findUnique({ where: { id } });

            // Mark corresponding event_join_request notifications as read/acted
            const pendingNotifs = await prisma.notification_log.findMany({
                where: {
                    template_key: 'event_join_request',
                    status: { not: 'read' }
                }
            });

            for (const notif of pendingNotifs) {
                try {
                    const parsed = JSON.parse(notif.provider_ref || '{}');
                    if (parsed.eventId === id && parsed.attendeeId === attendeeId) {
                        await prisma.notification_log.update({
                            where: { id: notif.id },
                            data: { status: 'read' }
                        });

                        const chatNamespace = (fastify as any).io?.of('/chat');
                        if (chatNamespace) {
                            chatNamespace.to(`user:${notif.user_id}`).emit('notification.acted', {
                                notificationId: notif.id,
                                action: action === 'accept' ? 'accepted' : 'declined'
                            });
                        }
                    }
                } catch (jsonErr) {}
            }

            // Notify Buyer of approval status
            const buyerUser = await prisma.users.findUnique({ where: { id: guestId || '' }, include: { profiles: true } });
            if (buyerUser?.primary_email) {
                const bName = Array.isArray(buyerUser.profiles) ? buyerUser.profiles[0]?.display_name : (buyerUser.profiles as any)?.display_name;
                await TicketNotificationService.notifyBuyer(booking, event, buyerUser.primary_email, bName || 'Buyer', action === 'accept' ? 'approved' : 'rejected');

                if (action === 'accept') {
                    // Fetch updated attendee and ticket
                    const updatedAttendee = await prisma.attendees.findUnique({ where: { id: attendeeId }, include: { tickets: true } });
                    if (updatedAttendee && updatedAttendee.tickets && event) {
                        await TicketNotificationService.handleAttendeeApproval(booking, event, updatedAttendee, updatedAttendee.tickets, buyerUser.primary_email, bName || 'Buyer');
                    }
                } else {
                    if (attendee.email && attendee.email.toLowerCase() !== buyerUser.primary_email.toLowerCase()) {
                        await sendEmail({
                            to: attendee.email,
                            subject: `Registration Update for ${event?.title || 'Event'}`,
                            html: `<p>Your registration request for the event <b>${event?.title || 'Event'}</b> has been rejected by the organizer.</p>`
                        }).catch(() => {});
                    }
                }
            }

            const groupsNamespace = (fastify as any).io?.of('/groups');
            if (groupsNamespace) {
                groupsNamespace.to(`event_${id}`).emit('dashboard_updated', { action, eventId: id });
            }

            const { MyEventsRealtimeService } = require('../services/MyEventsRealtimeService');
            if (guestId) {
                TicketRealtimeService.syncUser(guestId, id).catch(() => {});
                TicketRealtimeService.syncScanner(id).catch(() => {});
                MyEventsRealtimeService.syncUser(guestId).catch(() => {});
            }
            if (attendee.user_id && attendee.user_id !== guestId) {
                TicketRealtimeService.syncUser(attendee.user_id, id).catch(() => {});
                MyEventsRealtimeService.syncUser(attendee.user_id).catch(() => {});
            }
            MyEventsRealtimeService.syncUser(request.user.id).catch(() => {});

            return { success: true, message: `Request ${action}ed successfully.` };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/attendees/:attendeeId/checkin
    fastify.post('/:id/attendees/:attendeeId/checkin', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, attendeeId } = request.params as any;

            const canScan = await EventService.verifyEventScanner(request.user.id, id);
            if (!canScan) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const attendee = await prisma.attendees.findFirst({
                where: { id: attendeeId, bookings: { event_id: id } },
                include: { bookings: true }
            });
            if (!attendee) {
                return reply.status(404).send({ success: false, message: 'Attendee not found' });
            }

            const booking = attendee.bookings;
            const isCashPayment = booking?.payment_method === 'cash';
            const isPaymentPending = booking?.status === 'pending_payment';
            const paymentReceived = (request.body as any)?.paymentReceived === true;

            if (isCashPayment && isPaymentPending && !paymentReceived) {
                return reply.status(400).send({ success: false, message: 'Payment collection confirmation is required for cash ticket.' });
            }

            let updatedAttendee;
            await prisma.$transaction(async (tx) => {
                updatedAttendee = await tx.attendees.update({
                    where: { id: attendeeId },
                    data: { checkin_status: 'checked_in' }
                });

                if (attendee.ticket_id) {
                    await tx.tickets.update({
                        where: { id: attendee.ticket_id },
                        data: { status: 'checked_in' }
                    }).catch(() => {});
                }

                if (isCashPayment && isPaymentPending && paymentReceived) {
                    await tx.bookings.update({
                        where: { id: booking.id },
                        data: { status: 'confirmed' }
                    });
                }

                if (attendee.ticket_id) {
                    await tx.checkins.create({
                        data: {
                            tenant_id: attendee.tenant_id,
                            ticket_id: attendee.ticket_id,
                            method: 'attendee_search',
                            staff_user_id: request.user.id
                        }
                    }).catch(() => {});
                }
            });

            const groupsNamespace = (fastify as any).io?.of('/groups');
            if (groupsNamespace) {
                groupsNamespace.to(`event_${id}`).emit('dashboard_updated', { action: 'checkin', eventId: id });
            }

            // Send "Confirmed" ticket email after check-in
            (async () => {
                try {
                    const bookerUserId = booking?.booker_user_id;
                    if (bookerUserId && (await notificationService.shouldDeliver(bookerUserId, 'EVENT_CHECKIN', 'email'))) {
                        const guestUser = await prisma.users.findUnique({ where: { id: bookerUserId } });
                        if (guestUser?.primary_email && attendee.ticket_id) {
                            const tk = await prisma.tickets.findUnique({ where: { id: attendee.ticket_id } });
                            if (tk) {
                                const eventForEmail = await prisma.events.findUnique({ where: { id } });
                                const guestProfile = await prisma.profiles.findUnique({ where: { user_id: bookerUserId } });
                                const guestName = guestProfile?.display_name ||
                                    [guestUser.first_name, guestUser.last_name].filter(Boolean).join(' ') ||
                                    guestUser.primary_email.split('@')[0];
                                const vObj = (eventForEmail?.venue as any) || {};
                                const dateStr = eventForEmail?.starts_at
                                    ? new Date(eventForEmail.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                    : 'TBD';
                                const venueStr = vObj.address || vObj.name || eventForEmail?.location_type || 'TBD';
                                const lineItems = await prisma.booking_line_items.findMany({ where: { booking_id: booking.id } });
                                const bookingQty = lineItems.reduce((sum, item) => sum + item.quantity, 0);
                                const amtMinor = Number(booking?.total_amount_minor || 0);
                                const paidStr = amtMinor > 0 ? formatCurrency(amtMinor, booking?.total_currency || 'INR') : 'Free';
                                const htmlContent = generateTicketHtml({
                                    qrToken: tk.qr_token,
                                    ticketCode: tk.ticket_code || tk.id,
                                    attendeeName: guestName,
                                    dateString: dateStr,
                                    venueString: venueStr,
                                    paidAmount: paidStr,
                                    status: 'Confirmed',
                                    isOnline: eventForEmail?.location_type === 'online',
                                    onlineLink: eventForEmail?.online_link || '',
                                    cover: (eventForEmail as any)?.cover || ((eventForEmail?.venue as any)?.meta?.cover) || '',
                                    quantity: bookingQty
                                });
                                await sendEmail({
                                    to: guestUser.primary_email,
                                    subject: `✅ Check-in Confirmed — ${eventForEmail?.title || 'Your Event'}`,
                                    html: htmlContent
                                });
                                console.log(`[eventRoutes] Check-in confirmation email sent to ${guestUser.primary_email}`);
                            }
                        }
                    }
                } catch (emailErr: any) {
                    console.error('[eventRoutes] Failed to send check-in confirmation email:', emailErr.message);
                }
            })();

            return reply.send({ success: true, data: updatedAttendee, message: 'Attendee checked in successfully.' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/verify/:qrToken - host looks up a ticket by its QR token (manual entry or scanned)
    fastify.get('/:id/verify/:qrToken', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, qrToken } = request.params as any;

            const canScan = await EventService.verifyEventScanner(request.user.id, id);
            if (!canScan) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            let tickets: any[] = [];
            let isBookingQuery = false;

            if (qrToken.startsWith('BKG-')) {
                isBookingQuery = true;
                const partialId = qrToken.replace('BKG-', '').toLowerCase();
                const eventBookings = await prisma.bookings.findMany({
                    where: { event_id: id },
                    select: { id: true }
                });
                const matchedBooking = eventBookings.find(b => 
                    b.id.toLowerCase().replace(/-/g, '').startsWith(partialId) || 
                    b.id.toLowerCase().startsWith(partialId)
                );
                if (matchedBooking) {
                    const bookingId = matchedBooking.id;
                    tickets = await prisma.tickets.findMany({
                        where: {
                            booking_line_items: { booking_id: bookingId }
                        },
                        include: {
                            booking_line_items: { include: { bookings: true } },
                            attendees: { include: { users_attendees_user_idTousers: { select: { primary_email: true, profile_image_data: true, profiles: true } } } }
                        }
                    });
                }
            } else {
                const ticket = await prisma.tickets.findFirst({
                    where: { OR: [{ qr_token: qrToken }, { ticket_code: qrToken }] },
                    include: {
                        booking_line_items: { include: { bookings: true } },
                        attendees: { include: { users_attendees_user_idTousers: { select: { primary_email: true, profile_image_data: true, profiles: true } } } }
                    }
                });
                if (ticket) tickets = [ticket];
            }

            if (tickets.length === 0 || tickets[0].booking_line_items?.bookings?.event_id !== id) {
                return reply.send({ success: true, data: { valid: false, reason: 'not_found' } });
            }

            const event = await prisma.events.findUnique({
                where: { id }
            });
            const eventSettings = event?.settings as any || {};
            const isMultiEntry = eventSettings.offline_entry_type === 'multi';

            const ticketDataList = tickets.map(ticket => {
                const attendee = ticket.attendees?.[0] || null;
                const alreadyCheckedIn = isMultiEntry ? false : (ticket.status === 'checked_in' || attendee?.checkin_status === 'checked_in');
                const booking = ticket.booking_line_items?.bookings || null;
                const isCashPayment = booking?.payment_method === 'cash';
                const isPaymentPending = booking?.status === 'pending_payment';
                const amountMinor = booking?.total_amount_minor ? Number(booking.total_amount_minor) : 0;
                
                const user = attendee?.users_attendees_user_idTousers || null;
                const profile = Array.isArray(user?.profiles) ? user.profiles[0] : (user?.profiles || null);
                const userPic = user?.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(user.profile_image_data).toString('base64')}` : (profile?.img || null);
                const derivedUsername = profile?.user_name || (user?.primary_email ? user.primary_email.split('@')[0] : null);
                
                return {
                    valid: true,
                    alreadyCheckedIn,
                    ticketId: ticket.id,
                    qrToken: ticket.qr_token,
                    attendeeId: attendee?.id || null,
                    name: attendee?.name || ticket.attendee_name || 'Guest',
                    email: attendee?.email || ticket.attendee_email || null,
                    status: ticket.status,
                    isCashPayment,
                    isPaymentPending,
                    amountMinor,
                    userId: attendee?.user_id || null,
                    username: derivedUsername,
                    picture: userPic,
                    headline: profile?.headline || null,
                    bio: profile?.bio || null,
                };
            });

            return reply.send({
                success: true,
                data: {
                    isMultiple: isBookingQuery,
                    tickets: ticketDataList,
                    // For backwards compatibility with single ticket scans if any old client calls this
                    ...(ticketDataList[0] || { valid: false })
                }
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/verify/:qrToken/checkin - confirm check-in for a scanned/entered token
    fastify.post('/:id/verify/:qrToken/checkin', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, qrToken } = request.params as any;

            const canScan = await EventService.verifyEventScanner(request.user.id, id);
            if (!canScan) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const ticket = await prisma.tickets.findFirst({
                where: { OR: [{ qr_token: qrToken }, { ticket_code: qrToken }] },
                include: {
                    booking_line_items: { include: { bookings: true } },
                    attendees: true
                }
            });

            if (!ticket || ticket.booking_line_items?.bookings?.event_id !== id) {
                return reply.status(404).send({ success: false, message: 'Ticket not found for this event.' });
            }

            const event = await prisma.events.findUnique({
                where: { id }
            });
            const eventSettings = event?.settings as any || {};
            const isMultiEntry = eventSettings.offline_entry_type === 'multi';

            const attendee = ticket.attendees?.[0] || null;
            if (!isMultiEntry && (ticket.status === 'checked_in' || attendee?.checkin_status === 'checked_in')) {
                return reply.status(409).send({ success: false, message: 'This ticket has already been checked in.' });
            }

            const booking = ticket.booking_line_items?.bookings || null;
            const isCashPayment = booking?.payment_method === 'cash';
            const isPaymentPending = booking?.status === 'pending_payment';
            const paymentReceived = (request.body as any)?.paymentReceived === true;
            if (isCashPayment && isPaymentPending && !paymentReceived) {
                return reply.status(400).send({ success: false, message: 'Payment collection confirmation is required for cash ticket.' });
            }

            await prisma.$transaction(async (tx) => {
                await tx.tickets.update({
                    where: { id: ticket.id },
                    data: { status: 'checked_in' }
                });
                if (attendee) {
                    await tx.attendees.update({
                        where: { id: attendee.id },
                        data: { checkin_status: 'checked_in' }
                    });
                }
                if (isCashPayment && isPaymentPending && paymentReceived) {
                    await tx.bookings.update({
                        where: { id: booking.id },
                        data: { status: 'confirmed' }
                    });
                }
                await tx.checkins.create({
                    data: {
                        tenant_id: ticket.tenant_id,
                        ticket_id: ticket.id,
                        method: 'qr',
                        staff_user_id: request.user.id
                    }
                });
            });

            const groupsNamespace = (fastify as any).io?.of('/groups');
            if (groupsNamespace) {
                groupsNamespace.to(`event_${id}`).emit('dashboard_updated', { action: 'checkin', eventId: id });
            }

            // Send "Confirmed" ticket email after QR scanner check-in
            (async () => {
                try {
                    const bookerUserId = booking?.booker_user_id;
                    if (bookerUserId && (await notificationService.shouldDeliver(bookerUserId, 'EVENT_CHECKIN', 'email'))) {
                        const guestUser = await prisma.users.findUnique({ where: { id: bookerUserId } });
                        if (guestUser?.primary_email) {
                            const eventForEmail = await prisma.events.findUnique({ where: { id } });
                            const guestProfile = await prisma.profiles.findUnique({ where: { user_id: bookerUserId } });
                            const guestName = attendee?.name ||
                                guestProfile?.display_name ||
                                [guestUser.first_name, guestUser.last_name].filter(Boolean).join(' ') ||
                                guestUser.primary_email.split('@')[0];
                            const vObj = (eventForEmail?.venue as any) || {};
                            const dateStr = eventForEmail?.starts_at
                                ? new Date(eventForEmail.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                : 'TBD';
                            const venueStr = vObj.address || vObj.name || eventForEmail?.location_type || 'TBD';
                            const lineItems = await prisma.booking_line_items.findMany({ where: { booking_id: booking.id } });
                            const bookingQty = lineItems.reduce((sum, item) => sum + item.quantity, 0);
                            const amtMinor = Number(booking?.total_amount_minor || 0);
                            const paidStr = amtMinor > 0 ? formatCurrency(amtMinor, booking?.total_currency || 'INR') : 'Free';
                            const htmlContent = generateTicketHtml({
                                qrToken: ticket.qr_token,
                                ticketCode: ticket.ticket_code || ticket.id,
                                attendeeName: guestName,
                                dateString: dateStr,
                                venueString: venueStr,
                                paidAmount: paidStr,
                                status: 'Confirmed',
                                isOnline: eventForEmail?.location_type === 'online',
                                onlineLink: eventForEmail?.online_link || '',
                                cover: (eventForEmail as any)?.cover || ((eventForEmail?.venue as any)?.meta?.cover) || '',
                                quantity: bookingQty
                            });
                            await sendEmail({
                                to: guestUser.primary_email,
                                subject: `✅ Check-in Confirmed — ${eventForEmail?.title || 'Your Event'}`,
                                html: htmlContent
                            });
                            console.log(`[eventRoutes] QR check-in confirmation email sent to ${guestUser.primary_email}`);
                        }
                    }
                } catch (emailErr: any) {
                    console.error('[eventRoutes] Failed to send QR check-in confirmation email:', emailErr.message);
                }
            })();

            return reply.send({ success: true, message: `${attendee?.name || 'Attendee'} checked in successfully.` });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/gallery
    fastify.get('/:id/gallery', { preHandler: [(fastify as any).optionalAuthenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const data = await EventService.getEventGallery(id, request.user?.id);
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/gallery
    fastify.post('/:id/gallery', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await EventService.uploadToEventGallery(id, request.user.id, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('gallery_updated', { eventId: id, action: 'upload', itemId: data.id });
            }
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/gallery/:itemId/approve
    fastify.patch('/:id/gallery/:itemId/approve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, itemId } = request.params as any;
            await EventService.approveEventGalleryItem(id, Number(itemId), request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('gallery_updated', { eventId: id, action: 'approve', itemId });
            }
            return reply.send({ success: true });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/gallery/:itemId
    fastify.delete('/:id/gallery/:itemId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, itemId } = request.params as any;
            await EventService.deleteEventGalleryItem(id, Number(itemId), request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('gallery_updated', { eventId: id, action: 'remove', itemId });
            }
            return reply.send({ success: true });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/leave
    fastify.post('/:id/leave', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await EventService.leaveEvent(id, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`event_${id}`).emit('dashboard_updated', { action: 'leave_member', userId: request.user.id });
            }
            TicketRealtimeService.syncScanner(id).catch(() => {});
            return reply.send({ success: true, message: 'Left event successfully' });
        } catch (e: any) {
            return reply.status(400).send({ success: false, message: e.message });
        }
    });

    // ────────────────────────────────────────────────────────────────
    // TICKETING & COUPONS — Authorization helper
    // ────────────────────────────────────────────────────────────────
    const assertHostOrCoHost = async (eventId: string, userId: string) => {
        const event = await prisma.events.findUnique({ where: { id: eventId } });
        if (!event) throw new Error('Event not found');
        const authorized = await EventService.verifyEventTicketManager(userId, eventId);
        if (!authorized) throw new Error('Forbidden: host or co-host only');
        return event;
    };

    // ────────────────────────────────────────────────────────────────
    // AFFILIATES — List for referral link dropdown
    // ────────────────────────────────────────────────────────────────

    // GET /affiliates
    fastify.get('/affiliates', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const affiliates = await prisma.affiliates.findMany({
                where: { tenant_id: request.user.tenantId, status: 'active' },
                include: { users: { select: { id: true, first_name: true, last_name: true, primary_email: true } } },
                orderBy: { created_at: 'desc' }
            });
            const data = affiliates.map((a: any) => ({
                id: a.id,
                userId: a.user_id,
                name: [a.users?.first_name, a.users?.last_name].filter(Boolean).join(' ') || a.users?.primary_email || 'Unknown',
                email: a.users?.primary_email,
                status: a.status
            }));
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ────────────────────────────────────────────────────────────────
    // TICKET TYPES CRUD
    // ────────────────────────────────────────────────────────────────

    // GET /:id/ticket-types
    fastify.get('/:id/ticket-types', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const rows = await prisma.ticket_types.findMany({
                where: { event_id: id },
                orderBy: { created_at: 'desc' }
            });
            const data = rows.map((r: any) => ({
                ...r,
                price_minor: r.price_amount_minor !== null ? Number(r.price_amount_minor) : 0,
                price_amount_minor: r.price_amount_minor !== null ? Number(r.price_amount_minor) : null,
                early_bird_price_minor: r.early_bird_price_amount_minor !== null ? Number(r.early_bird_price_amount_minor) : null,
                early_bird_price_amount_minor: r.early_bird_price_amount_minor !== null ? Number(r.early_bird_price_amount_minor) : null
            }));
            return reply.send({ success: true, data });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : e.message?.startsWith('Event') ? 404 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // POST /:id/ticket-types
    fastify.post('/:id/ticket-types', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const b = request.body as any;
            if (!b.name) return reply.status(400).send({ success: false, message: 'Ticket name is required' });
            const created = await prisma.ticket_types.create({
                data: {
                    event_id: id,
                    tenant_id: request.user.tenantId,
                    name: b.name,
                    description: b.description || null,
                    price_amount_minor: b.price != null ? BigInt(Math.round(Number(b.price) * 100)) : null,
                    price_currency: b.currency || 'INR',
                    capacity: b.capacity ? Number(b.capacity) : null,
                    max_per_booking: b.max_per_booking ? Number(b.max_per_booking) : null,
                    sale_start: b.sale_start ? new Date(b.sale_start) : null,
                    sale_end: b.sale_end ? new Date(b.sale_end) : null,
                    early_bird_price_amount_minor: b.early_bird_price != null ? BigInt(Math.round(Number(b.early_bird_price) * 100)) : null,
                    early_bird_price_currency: b.early_bird_currency || null,
                    early_bird_ends_at: b.early_bird_ends_at ? new Date(b.early_bird_ends_at) : null,
                    visibility: b.visibility || 'public',
                    eligibility: {}
                }
            });
            return reply.status(201).send({ success: true, data: { ...created, price_minor: created.price_amount_minor !== null ? Number(created.price_amount_minor) : 0, price_amount_minor: created.price_amount_minor !== null ? Number(created.price_amount_minor) : null, early_bird_price_minor: created.early_bird_price_amount_minor !== null ? Number(created.early_bird_price_amount_minor) : null, early_bird_price_amount_minor: created.early_bird_price_amount_minor !== null ? Number(created.early_bird_price_amount_minor) : null } });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // PUT /:id/ticket-types/:ttId
    fastify.put('/:id/ticket-types/:ttId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, ttId } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const b = request.body as any;
            const updated = await prisma.ticket_types.update({
                where: { id: ttId },
                data: {
                    ...(b.name !== undefined && { name: b.name }),
                    ...(b.description !== undefined && { description: b.description }),
                    ...(b.price !== undefined && { price_amount_minor: b.price != null ? BigInt(Math.round(Number(b.price) * 100)) : null }),
                    ...(b.currency !== undefined && { price_currency: b.currency }),
                    ...(b.capacity !== undefined && { capacity: b.capacity ? Number(b.capacity) : null }),
                    ...(b.max_per_booking !== undefined && { max_per_booking: b.max_per_booking ? Number(b.max_per_booking) : null }),
                    ...(b.sale_start !== undefined && { sale_start: b.sale_start ? new Date(b.sale_start) : null }),
                    ...(b.sale_end !== undefined && { sale_end: b.sale_end ? new Date(b.sale_end) : null }),
                    ...(b.early_bird_price !== undefined && { early_bird_price_amount_minor: b.early_bird_price != null ? BigInt(Math.round(Number(b.early_bird_price) * 100)) : null }),
                    ...(b.early_bird_currency !== undefined && { early_bird_price_currency: b.early_bird_currency }),
                    ...(b.early_bird_ends_at !== undefined && { early_bird_ends_at: b.early_bird_ends_at ? new Date(b.early_bird_ends_at) : null }),
                    ...(b.visibility !== undefined && { visibility: b.visibility }),
                    updated_at: new Date()
                }
            });
            return reply.send({ success: true, data: { ...updated, price_minor: updated.price_amount_minor !== null ? Number(updated.price_amount_minor) : 0, price_amount_minor: updated.price_amount_minor !== null ? Number(updated.price_amount_minor) : null, early_bird_price_minor: updated.early_bird_price_amount_minor !== null ? Number(updated.early_bird_price_amount_minor) : null, early_bird_price_amount_minor: updated.early_bird_price_amount_minor !== null ? Number(updated.early_bird_price_amount_minor) : null } });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/ticket-types/:ttId
    fastify.delete('/:id/ticket-types/:ttId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, ttId } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            try {
                await prisma.ticket_types.delete({ where: { id: ttId } });
            } catch (err: any) {
                if (err.code === 'P2003') {
                    throw new Error('Cannot delete this ticket type because it is already in use by existing bookings. Please hide it instead.');
                }
                if (err.code === 'P2025') {
                    // Record doesn't exist, treat as success
                } else {
                    throw err;
                }
            }
            return reply.send({ success: true });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // ────────────────────────────────────────────────────────────────
    // COUPONS CRUD
    // ────────────────────────────────────────────────────────────────

    // GET /:id/coupons
    fastify.get('/:id/coupons', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const rows = await prisma.coupons.findMany({
                where: { event_id: id },
                orderBy: { created_at: 'desc' }
            });
            const data = rows.map((r: any) => ({
                ...r,
                discount_amount_minor: r.discount_amount_minor !== null ? Number(r.discount_amount_minor) : null,
                discount_percent: r.discount_percent !== null ? Number(r.discount_percent) : null
            }));
            return reply.send({ success: true, data });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // POST /:id/coupons
    fastify.post('/:id/coupons', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const b = request.body as any;
            if (!b.code) return reply.status(400).send({ success: false, message: 'Coupon code is required' });
            if (!b.discount_type) return reply.status(400).send({ success: false, message: 'Discount type is required' });
            const created = await prisma.coupons.create({
                data: {
                    event_id: id,
                    tenant_id: request.user.tenantId,
                    code: b.code.toUpperCase(),
                    discount_type: b.discount_type, // 'percent' | 'flat'
                    discount_amount_minor: b.discount_type === 'flat' && b.discount_value != null ? BigInt(Math.round(Number(b.discount_value) * 100)) : null,
                    discount_currency: b.discount_type === 'flat' ? (b.currency || 'INR') : null,
                    discount_percent: b.discount_type === 'percent' && b.discount_value != null ? Number(b.discount_value) : null,
                    valid_from: b.valid_from ? new Date(b.valid_from) : null,
                    valid_to: b.valid_to ? new Date(b.valid_to) : null,
                    max_total: b.max_total ? Number(b.max_total) : null,
                    max_per_user: b.max_per_user ? Number(b.max_per_user) : null,
                    status: b.status || 'active'
                }
            });
            return reply.status(201).send({ success: true, data: { ...created, discount_amount_minor: created.discount_amount_minor !== null ? Number(created.discount_amount_minor) : null, discount_percent: created.discount_percent !== null ? Number(created.discount_percent) : null } });
        } catch (e: any) {
            if (e.code === 'P2002') return reply.status(409).send({ success: false, message: 'Coupon code already exists for this event' });
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // PUT /:id/coupons/:cId
    fastify.put('/:id/coupons/:cId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, cId } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const b = request.body as any;
            const updated = await prisma.coupons.update({
                where: { id: cId },
                data: {
                    ...(b.code !== undefined && { code: b.code.toUpperCase() }),
                    ...(b.discount_type !== undefined && { discount_type: b.discount_type }),
                    ...(b.discount_value !== undefined && b.discount_type === 'flat' && { discount_amount_minor: b.discount_value != null ? BigInt(Math.round(Number(b.discount_value) * 100)) : null }),
                    ...(b.discount_value !== undefined && b.discount_type === 'percent' && { discount_percent: b.discount_value != null ? Number(b.discount_value) : null }),
                    ...(b.currency !== undefined && { discount_currency: b.currency }),
                    ...(b.valid_from !== undefined && { valid_from: b.valid_from ? new Date(b.valid_from) : null }),
                    ...(b.valid_to !== undefined && { valid_to: b.valid_to ? new Date(b.valid_to) : null }),
                    ...(b.max_total !== undefined && { max_total: b.max_total ? Number(b.max_total) : null }),
                    ...(b.max_per_user !== undefined && { max_per_user: b.max_per_user ? Number(b.max_per_user) : null }),
                    ...(b.status !== undefined && { status: b.status }),
                    updated_at: new Date()
                }
            });
            return reply.send({ success: true, data: { ...updated, discount_amount_minor: updated.discount_amount_minor !== null ? Number(updated.discount_amount_minor) : null, discount_percent: updated.discount_percent !== null ? Number(updated.discount_percent) : null } });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/coupons/:cId
    fastify.delete('/:id/coupons/:cId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, cId } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            await prisma.coupons.delete({ where: { id: cId } });
            return reply.send({ success: true });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // ────────────────────────────────────────────────────────────────
    // REFERRAL LINKS CRUD
    // ────────────────────────────────────────────────────────────────

    // GET /:id/referrals
    fastify.get('/:id/referrals', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const rows = await prisma.referral_links.findMany({
                where: { event_id: id },
                include: { affiliates: { include: { users: { select: { first_name: true, last_name: true, primary_email: true } } } } },
                orderBy: { created_at: 'desc' }
            });
            const data = rows.map((r: any) => ({
                id: r.id,
                code: r.code,
                affiliate_id: r.affiliate_id,
                affiliate_name: [r.affiliates?.users?.first_name, r.affiliates?.users?.last_name].filter(Boolean).join(' ') || r.affiliates?.users?.primary_email || 'Unknown',
                commission_rule: r.commission_rule,
                created_at: r.created_at,
                updated_at: r.updated_at
            }));
            return reply.send({ success: true, data });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // POST /:id/referrals
    fastify.post('/:id/referrals', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const b = request.body as any;
            if (!b.code) return reply.status(400).send({ success: false, message: 'Referral code is required' });
            if (!b.affiliate_id) return reply.status(400).send({ success: false, message: 'Affiliate is required' });
            let commissionRule: any = null;
            if (b.commission_rule) {
                try { commissionRule = typeof b.commission_rule === 'string' ? JSON.parse(b.commission_rule) : b.commission_rule; }
                catch { commissionRule = { description: b.commission_rule }; }
            }
            const created = await prisma.referral_links.create({
                data: {
                    tenant_id: request.user.tenantId,
                    event_id: id,
                    affiliate_id: b.affiliate_id,
                    code: b.code.toUpperCase(),
                    commission_rule: commissionRule
                },
                include: { affiliates: { include: { users: { select: { first_name: true, last_name: true, primary_email: true } } } } }
            });
            return reply.status(201).send({ success: true, data: {
                id: created.id, code: created.code, affiliate_id: created.affiliate_id,
                affiliate_name: [created.affiliates?.users?.first_name, created.affiliates?.users?.last_name].filter(Boolean).join(' ') || created.affiliates?.users?.primary_email || 'Unknown',
                commission_rule: created.commission_rule, created_at: created.created_at
            }});
        } catch (e: any) {
            if (e.code === 'P2002') return reply.status(409).send({ success: false, message: 'Referral code already exists' });
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // PUT /:id/referrals/:rId
    fastify.put('/:id/referrals/:rId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, rId } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            const b = request.body as any;
            let commissionRule: any = undefined;
            if (b.commission_rule !== undefined) {
                try { commissionRule = typeof b.commission_rule === 'string' ? JSON.parse(b.commission_rule) : b.commission_rule; }
                catch { commissionRule = { description: b.commission_rule }; }
            }
            const updated = await prisma.referral_links.update({
                where: { id: rId },
                data: {
                    ...(b.code !== undefined && { code: b.code.toUpperCase() }),
                    ...(b.affiliate_id !== undefined && { affiliate_id: b.affiliate_id }),
                    ...(commissionRule !== undefined && { commission_rule: commissionRule }),
                    updated_at: new Date()
                },
                include: { affiliates: { include: { users: { select: { first_name: true, last_name: true, primary_email: true } } } } }
            });
            return reply.send({ success: true, data: {
                id: updated.id, code: updated.code, affiliate_id: updated.affiliate_id,
                affiliate_name: [updated.affiliates?.users?.first_name, updated.affiliates?.users?.last_name].filter(Boolean).join(' ') || updated.affiliates?.users?.primary_email || 'Unknown',
                commission_rule: updated.commission_rule, created_at: updated.created_at, updated_at: updated.updated_at
            }});
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/referrals/:rId
    fastify.delete('/:id/referrals/:rId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, rId } = request.params as any;
            await assertHostOrCoHost(id, request.user.id);
            await prisma.referral_links.delete({ where: { id: rId } });
            return reply.send({ success: true });
        } catch (e: any) {
            const status = e.message?.startsWith('Forbidden') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // ────────────────────────────────────────────────────────────────
    // EVENT INVITE LINKS — one-time links for unlisted visibility ('view')
    // and invite-only join eligibility ('join')
    // ────────────────────────────────────────────────────────────────

    // POST /:id/invites — host/co-host generates an invite link.
    // 'view' links are durable/reusable (idempotent: repeat calls return the same link).
    // 'join' links are single-use, a fresh token is minted on every call.
    fastify.post('/:id/invites', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { purpose } = request.body as any;
            if (purpose !== 'view' && purpose !== 'join') {
                return reply.status(400).send({ success: false, message: "purpose must be 'view' or 'join'" });
            }
            const data = await EventInvitationService.createLink(id, request.user.id, purpose);
            return reply.send({ success: true, data });
        } catch (e: any) {
            const status = e.message?.includes('permission') ? 403 : 500;
            return reply.status(status).send({ success: false, message: e.message });
        }
    });

    // GET /:id/invites/view — host/co-host fetches the durable 'view' link if one already
    // exists (without minting a new one), so the Invite tab can restore it after a reload.
    fastify.get('/:id/invites/view', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const isHostOrCoHost = await EventService.verifyEventHostOrCoHost(request.user.id, id);
            if (!isHostOrCoHost) return reply.status(403).send({ success: false, message: 'You do not have permission to view invite links for this event' });
            const data = await EventInvitationService.getExistingViewLink(id);
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /invite/:token — public lookup (read-only, does not consume the token) used by
    // the invite landing page to find out which event/purpose a link corresponds to.
    fastify.get('/invite/:token', async (request: any, reply) => {
        try {
            const { token } = request.params as any;
            const validation = await EventInvitationService.validateToken(token);
            if (!validation.valid) {
                return reply.send({ success: false, message: validation.message });
            }
            return reply.send({
                success: true,
                data: { event: validation.event, purpose: validation.invite?.purpose }
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/bookings/:bookingId/confirm-cash
    fastify.post('/:id/bookings/:bookingId/confirm-cash', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, bookingId } = request.params as any;
            const { remarks } = request.body as any || {};

            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) return reply.status(403).send({ success: false, message: 'Forbidden' });

            const booking = await prisma.bookings.findUnique({
                where: { id: bookingId },
                include: { events: true }
            });
            if (!booking) return reply.status(404).send({ success: false, message: 'Booking not found' });

            await prisma.$transaction(async (tx) => {
                await tx.bookings.update({
                    where: { id: bookingId },
                    data: { status: 'confirmed' }
                });

                const lineItems = await tx.booking_line_items.findMany({
                    where: { booking_id: bookingId }
                });

                for (const li of lineItems) {
                    await tx.tickets.updateMany({
                        where: { line_item_id: li.id },
                        data: { status: 'confirmed' }
                    });
                }

                await tx.attendees.updateMany({
                    where: { booking_id: bookingId },
                    data: { status: 'approved' }
                });

                await tx.$executeRawUnsafe(
                    `INSERT INTO event_registration_log (event_id, changed_by, action, booking_id, remarks)
                     VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5)`,
                    id, request.user.id, 'status_changed_to_confirmed', bookingId, remarks || 'Payment confirmed by host'
                );
            });

            // Try sending confirmation email
            try {
                const attendee = await prisma.attendees.findFirst({
                    where: { booking_id: bookingId }
                });
                if (attendee && attendee.email && booking.events) {
                    const { sendEmail, generateTicketHtml, formatCurrency } = require('../utils/email');
                    const dateStr = booking.events.starts_at ? new Date(booking.events.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBD';
                    const vObj = (booking.events.venue as any) || {};
                    const venueStr = vObj.address || vObj.name || booking.events.location_type || 'TBD';
                    const lineItems = await prisma.booking_line_items.findMany({ where: { booking_id: bookingId } });
                    const bookingQty = lineItems.reduce((sum, item) => sum + item.quantity, 0);
                    const totalPaidMinor = booking.total_amount_minor ? Number(booking.total_amount_minor) : 0;
                    const paidStr = totalPaidMinor > 0 ? formatCurrency(totalPaidMinor, booking.total_currency || 'INR') : 'Free';

                    const ticketRecord = await prisma.tickets.findFirst({
                        where: { line_item_id: { in: lineItems.map(li => li.id) } }
                    });

                    if (ticketRecord) {
                        const htmlContent = generateTicketHtml({
                            qrToken: ticketRecord.qr_token,
                            ticketCode: ticketRecord.ticket_code || ticketRecord.id,
                            attendeeName: attendee.name,
                            dateString: dateStr,
                            venueString: venueStr,
                            paidAmount: paidStr,
                            status: 'Confirmed',
                            isOnline: booking.events.location_type === 'online',
                            onlineLink: booking.events.online_link || '',
                            cover: (booking.events as any).cover || ((booking.events.venue as any)?.meta?.cover) || '',
                            quantity: bookingQty
                        });

                        await sendEmail({
                            to: attendee.email,
                            subject: `Your ticket for ${booking.events.title}`,
                            html: htmlContent
                        });
                    }
                }
            } catch (emailErr) {
                console.error('[confirm-cash] Failed to send email:', emailErr);
            }

            return reply.send({ success: true });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/bookings/:bookingId/reject-cash
    fastify.post('/:id/bookings/:bookingId/reject-cash', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, bookingId } = request.params as any;
            const { remarks } = request.body as any || {};

            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) return reply.status(403).send({ success: false, message: 'Forbidden' });

            await prisma.$transaction(async (tx) => {
                await tx.bookings.update({
                    where: { id: bookingId },
                    data: { status: 'cancelled' }
                });

                const lineItems = await tx.booking_line_items.findMany({
                    where: { booking_id: bookingId }
                });

                for (const li of lineItems) {
                    await tx.tickets.updateMany({
                        where: { line_item_id: li.id },
                        data: { status: 'cancelled' }
                    });
                }

                await tx.attendees.updateMany({
                    where: { booking_id: bookingId },
                    data: { status: 'rejected' }
                });

                await tx.$executeRawUnsafe(
                    `INSERT INTO event_registration_log (event_id, changed_by, action, booking_id, remarks)
                     VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5)`,
                    id, request.user.id, 'status_changed_to_cancelled', bookingId, remarks || 'Payment rejected by host'
                );
            });

            await EventService.reconcileWaitlist(id);

            return reply.send({ success: true });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/bookings/:bookingId/refund-cash
    fastify.post('/:id/bookings/:bookingId/refund-cash', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, bookingId } = request.params as any;
            const { remarks } = request.body as any || {};

            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) return reply.status(403).send({ success: false, message: 'Forbidden' });

            await prisma.$transaction(async (tx) => {
                await tx.bookings.update({
                    where: { id: bookingId },
                    data: { status: 'refunded_offline' }
                });

                const lineItems = await tx.booking_line_items.findMany({
                    where: { booking_id: bookingId }
                });

                for (const li of lineItems) {
                    await tx.tickets.updateMany({
                        where: { line_item_id: li.id },
                        data: { status: 'cancelled' }
                    });
                }

                await tx.attendees.updateMany({
                    where: { booking_id: bookingId },
                    data: { status: 'rejected' }
                });

                await tx.$executeRawUnsafe(
                    `INSERT INTO event_registration_log (event_id, changed_by, action, booking_id, remarks)
                     VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5)`,
                    id, request.user.id, 'status_changed_to_refunded-offline', bookingId, remarks || 'Offline refund processed by host'
                );
            });

            await EventService.reconcileWaitlist(id);

            return reply.send({ success: true });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /bookings/:bookingId/payment-proof
    fastify.post('/bookings/:bookingId/payment-proof', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { bookingId } = request.params as any;

            const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
            if (!booking) return reply.status(404).send({ success: false, message: 'Booking not found' });
            if (booking.booker_user_id !== request.user.id) {
                return reply.status(403).send({ success: false, message: 'Forbidden: You do not own this booking' });
            }

            const { transactionId } = request.body || {};
            let proofData = transactionId;

            if (!proofData || typeof proofData !== 'string') {
                return reply.status(400).send({ success: false, message: 'Transaction ID is required' });
            }

            await prisma.bookings.update({
                where: { id: bookingId },
                data: { payment_proof_url: proofData }
            });

            const event = await prisma.events.findUnique({ where: { id: booking.event_id } });
            if (event) {
                const groupsNamespace = (fastify as any).io?.of('/groups');
                if (groupsNamespace) {
                    groupsNamespace.to(`event_${event.id}`).emit('dashboard_updated', { action: 'payment-proof', eventId: event.id });
                }

                let ownerUserId = null;
                const entityRow = await prisma.entities.findUnique({ where: { id: event.hosted_by_entity_id } });
                if (entityRow) ownerUserId = entityRow.user_id;
                if (!ownerUserId) {
                    const ownerRole = await prisma.roles.findFirst({ where: { key: 'group_owner' } });
                    if (ownerRole) {
                        const assignment = await prisma.role_assignments.findFirst({
                            where: { scope_entity_id: event.hosted_by_entity_id, role_id: ownerRole.id }
                        });
                        if (assignment) ownerUserId = assignment.user_id;
                    }
                }
                
                if (ownerUserId) {
                    const requesterName = request.user.first_name ? `${request.user.first_name} ${request.user.last_name || ''}`.trim() : request.user.primary_email;
                    const notif = await prisma.notification_log.create({
                        data: {
                            tenant_id: event.tenant_id,
                            user_id: ownerUserId,
                            channel: 'app',
                            template_key: 'event_join_request',
                            status: 'queued',
                            provider_ref: JSON.stringify({
                                eventId: event.id,
                                eventTitle: event.title,
                                requesterId: request.user.id,
                                requesterName
                            })
                        }
                    });

                    const chatNamespace = (fastify as any).io?.of('/chat');
                    if (chatNamespace) {
                        chatNamespace.to(`user:${ownerUserId}`).emit('group.notification', {
                            id: notif.id,
                            type: 'registration',
                            text: `<b>${requesterName}</b> submitted a cash payment proof for <b>${event.title}</b>`,
                            eventId: event.id
                        });
                    }
                }
            }

            return reply.send({ success: true, paymentProofUrl: proofData });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

};


