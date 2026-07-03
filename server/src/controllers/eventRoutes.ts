import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { EventService } from '../services/EventService';
import prisma from '../config/prisma';

export const eventRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    // POST /
    fastify.post('', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            if (!request.body.title) {
                return reply.status(400).send({ success: false, message: 'Title is required' });
            }
            const data = await EventService.createEvent(request.user.id, request.user.tenantId, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'create' });
            }
            return reply.status(201).send({ success: true, data, message: 'Event created successfully' });
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

    // GET /joined - events the user has joined or requested to join
    fastify.get('/joined', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const userId = request.user.id;

            // Fetch bookings with their related events in a single query
            const bookings = await prisma.bookings.findMany({
                where: {
                    booker_user_id: userId,
                    status: { in: ['confirmed', 'pending_approval'] }
                },
                include: {
                    events: true
                },
                orderBy: { created_at: 'desc' }
            });

            // Deduplicate by event_id (keep latest booking per event)
            const seen = new Set<string>();
            const results: any[] = [];

            for (const booking of bookings) {
                if (seen.has(booking.event_id)) continue;
                seen.add(booking.event_id);

                const event = booking.events;
                if (!event || event.status === 'cancelled') continue;

                // Fetch ticket types for this event
                const ticketsRaw = await prisma.ticket_types.findMany({
                    where: { event_id: booking.event_id }
                });

                const tickets = ticketsRaw.map((t: any) => ({
                    ...t,
                    price_amount_minor: t.price_amount_minor !== null && t.price_amount_minor !== undefined ? Number(t.price_amount_minor) : null,
                    early_bird_price_amount_minor: t.early_bird_price_amount_minor !== null && t.early_bird_price_amount_minor !== undefined ? Number(t.early_bird_price_amount_minor) : null
                }));

                results.push({
                    ...event,
                    tickets,
                    bookingStatus: booking.status,
                    bookingId: booking.id
                });
            }

            return reply.send({ success: true, data: results });
        } catch (e: any) {
            fastify.log.error(e, 'GET /events/joined failed');
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /
    fastify.get('', async (request: any, reply) => {
        try {
            const tenantId = request.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
            const data = await EventService.getPublicEvents(tenantId as string);
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id
    fastify.get('/:id', async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const data = await EventService.getEventById(id);
            let bookingStatus = null;
            let bookingId = null;
            if (request.headers.authorization) {
                try {
                    const token = request.headers.authorization.split(' ')[1];
                    const decoded = (fastify as any).jwt.verify(token);
                    if (decoded && decoded.id) {
                        const booking = await prisma.bookings.findFirst({
                            where: {
                                event_id: id,
                                booker_user_id: decoded.id
                            },
                            orderBy: { created_at: 'desc' }
                        });
                        if (booking) {
                            bookingStatus = booking.status;
                            bookingId = booking.id;
                        }
                    }
                } catch (jwtErr) {
                    // Ignore JWT verify errors
                }
            }

            const confirmedAttendees = await prisma.attendees.findMany({
                where: { bookings: { event_id: id, status: 'confirmed' } }
            });
            const attendeeNames = confirmedAttendees.map(a => a.name);

            return reply.send({
                success: true,
                data: {
                    ...data,
                    bookingStatus,
                    bookingId,
                    attendees: attendeeNames
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
            const data = await EventService.updateEvent(id, request.user.id, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'update', eventId: id });
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
            await EventService.deleteEvent(id, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('events_updated', { action: 'delete', eventId: id });
            }
            return reply.send({ success: true, message: 'Event cancelled/deleted' });
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
            }
            return reply.send({ success: true, data, message: 'Event published' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
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
            const data = await EventService.createEventPost(id, request.user, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_thread', { groupId: id, postId: (data as any).id });
            }
            return reply.status(201).send({ success: true, data, message: 'Post created' });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_edited', { groupId: id, postId });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_deleted', { groupId: id, postId });
            }
            return { success: true, message: 'Post deleted' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_comment', { groupId: id, postId, commentId: (data as any).id });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_edited', { groupId: id, postId, commentId });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_deleted', { groupId: id, postId, commentId });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_voted', { groupId: id, postId, score: data.vote_score });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_voted', { groupId: id, postId, commentId, score: data.vote_score });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_reacted', { groupId: id, postId, reactions });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_solved', { groupId: id, postId, solved });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_archived', { groupId: id, postId, archived });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_pinned', { groupId: id, postId, pinned });
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
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_locked', { groupId: id, postId, locked });
            }
            return { success: true, message: locked ? 'Post locked' : 'Post unlocked' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

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

            // Confirmed attendees
            const confirmedAttendees = await prisma.attendees.findMany({
                where: { bookings: { event_id: id, status: 'confirmed' } }
            });

            // Pending join requests
            const pendingRequests = await prisma.attendees.findMany({
                where: { bookings: { event_id: id, status: 'pending_approval' } }
            });

            const totalRevenueMinor = bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + Number(b.total_amount_minor || 0), 0);

            const checkedInCount = confirmedAttendees.filter(a => a.checkin_status === 'checked_in').length;

            return {
                success: true,
                data: {
                    totalAttendees: confirmedAttendees.length,
                    checkedInCount,
                    pendingRequestsCount: pendingRequests.length,
                    revenue: totalRevenueMinor / 100,
                    capacity: event.capacity_total || 120,
                    confirmed: confirmedAttendees.map(a => {
                        let parsedAnswers = {};
                        try {
                            parsedAnswers = JSON.parse(a.notes || '{}');
                        } catch (e) {}
                        return {
                            id: a.id,
                            userId: a.user_id,
                            bookingId: a.booking_id,
                            name: a.name,
                            email: a.email,
                            checkinStatus: a.checkin_status,
                            answers: parsedAnswers
                        };
                    }),
                    requests: pendingRequests.map(r => {
                        let parsedAnswers = {};
                        try {
                            parsedAnswers = JSON.parse(r.notes || '{}');
                        } catch (e) {}
                        return {
                            id: r.id,
                            userId: r.user_id,
                            bookingId: r.booking_id,
                            name: r.name,
                            email: r.email,
                            answers: parsedAnswers
                        };
                    })
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/requests/:bookingId/action
    fastify.post('/:id/requests/:bookingId/action', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, bookingId } = request.params as any;
            const { action } = request.body || {};

            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const booking = await prisma.bookings.findFirst({
                where: { id: bookingId, event_id: id }
            });
            if (!booking) {
                return reply.status(404).send({ success: false, message: 'Booking not found' });
            }

            const nextStatus = action === 'accept' ? 'confirmed' : 'cancelled';
            const nextTicketStatus = action === 'accept' ? 'confirmed' : 'cancelled';

            await prisma.$transaction(async (tx) => {
                await tx.bookings.update({
                    where: { id: bookingId },
                    data: { status: nextStatus }
                });
                const lineItems = await tx.booking_line_items.findMany({
                    where: { booking_id: bookingId }
                });
                const liIds = lineItems.map(li => li.id);
                await tx.tickets.updateMany({
                    where: { line_item_id: { in: liIds } },
                    data: { status: nextTicketStatus }
                });
            });

            const guestId = booking.booker_user_id;
            const event = await prisma.events.findUnique({ where: { id } });
            const templateKey = action === 'accept' ? 'event_request_accepted' : 'event_request_declined';

            await prisma.notification_log.create({
                data: {
                    tenant_id: booking.tenant_id,
                    user_id: guestId,
                    channel: 'app',
                    template_key: templateKey,
                    status: 'queued',
                    provider_ref: JSON.stringify({
                        eventId: id,
                        eventTitle: event?.title || ''
                    })
                }
            });

            const chatNamespace = (fastify as any).io?.of('/chat');
            if (chatNamespace) {
                chatNamespace.to(`user:${guestId}`).emit('group.notification', {
                    type: action === 'accept' ? 'event' : 'system',
                    text: action === 'accept' 
                        ? `Your request to join <b>${event?.title}</b> was accepted! 🎉` 
                        : `Your request to join <b>${event?.title}</b> was declined`
                });
            }

            const groupsNamespace = (fastify as any).io?.of('/groups');
            if (groupsNamespace) {
                groupsNamespace.to(`event_${id}`).emit('dashboard_updated', { action, eventId: id });
            }

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

            const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
            if (!isAdmin) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const attendee = await prisma.attendees.findFirst({
                where: { id: attendeeId, bookings: { event_id: id } }
            });
            if (!attendee) {
                return reply.status(404).send({ success: false, message: 'Attendee not found' });
            }

            const updated = await prisma.attendees.update({
                where: { id: attendeeId },
                data: { checkin_status: 'checked_in' }
            });

            const groupsNamespace = (fastify as any).io?.of('/groups');
            if (groupsNamespace) {
                groupsNamespace.to(`event_${id}`).emit('dashboard_updated', { action: 'checkin', eventId: id });
            }

            return reply.send({ success: true, data: updated, message: 'Attendee checked in successfully.' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
};
