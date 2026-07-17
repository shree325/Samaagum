import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { GroupService } from '../services/GroupService';
import { InvitationService } from '../services/InvitationService';
import { GroupNotificationService } from '../services/GroupNotificationService';
import { notificationService } from '../services/NotificationService';
import prisma from '../config/prisma';


export const groupRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    // POST /
    fastify.post('', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            if (!request.body.name) {
                return reply.status(400).send({ success: false, message: 'Name is required' });
            }
            const data = await GroupService.createGroup(request.user.id, request.user.tenantId, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('groups_updated', { action: 'new_group' });
            }
            return reply.status(201).send({ success: true, data, message: 'Group created' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /available-roles
    fastify.get('/available-roles', { preHandler: [(fastify as any).optionalAuthenticate] }, async (request: any, reply) => {
        try {
            const roles = await GroupService.getAvailableGroupRoles();
            return reply.send({ success: true, data: roles });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /my
    fastify.get('/my', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const data = await GroupService.getUserGroups(request.user.id);
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /my-managed
    fastify.get('/my-managed', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const data = await GroupService.getMyManagedGroups(request.user.id);
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /mine/as-host — returns groups the user can host events under
    fastify.get('/mine/as-host', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const userId = request.user.id;

            // Fetch the role definitions for group_owner and group_admin
            const rolesList = await prisma.roles.findMany({
                where: { key: { in: ['group_owner', 'group_admin'] } }
            });
            const roleIds = rolesList.map(r => r.id);

            // Fetch assignments for this user
            const assignments = await prisma.role_assignments.findMany({
                where: {
                    user_id: userId,
                    role_id: { in: roleIds }
                }
            });

            const scopeEntityIds = assignments
                .map(a => a.scope_entity_id)
                .filter((id): id is string => id !== null);

            if (scopeEntityIds.length === 0) {
                return reply.send({ success: true, data: [] });
            }

            // Retrieve matching groups
            const userGroups = await prisma.groups.findMany({
                where: {
                    entity_id: { in: scopeEntityIds }
                }
            });

            const groups = userGroups.map(g => {
                const assocAssignment = assignments.find(a => a.scope_entity_id === g.entity_id);
                const assocRole = rolesList.find(r => r.id === assocAssignment?.role_id);
                return {
                    id: g.entity_id,
                    entity_id: g.entity_id,
                    name: g.name,
                    icon: g.icon || null,
                    cover: g.cover || null,
                    role: assocRole?.key === 'group_owner' ? 'owner' : 'admin'
                };
            });

            return reply.send({ success: true, data: groups });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/banner
    fastify.get('/:id/banner', async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const res = await GroupService.getGroupBanner(id);
            if (!res) return reply.status(404).send('Not found');
            if (res.banner_data) {
                const buf = Buffer.from(res.banner_data);
                reply.header('Content-Type', GroupService.detectMime(buf));
                reply.header('Cache-Control', 'public, max-age=86400');
                return reply.send(buf);
            }
            if (res.banner && !res.banner.startsWith('blob:')) return reply.redirect(res.banner);
            return reply.status(404).send('No banner');
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/icon
    fastify.get('/:id/icon', async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const res = await GroupService.getGroupIcon(id);
            if (!res) return reply.status(404).send('Not found');
            if (res.icon_data) {
                const buf = Buffer.from(res.icon_data);
                reply.header('Content-Type', GroupService.detectMime(buf));
                reply.header('Cache-Control', 'public, max-age=86400');
                return reply.send(buf);
            }
            if (res.icon && !res.icon.startsWith('blob:') && !res.icon.startsWith('/api/')) return reply.redirect(res.icon);
            return reply.status(404).send('No icon');
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/conducted-events — read-only list of past events hosted by this group
    fastify.get('/:id/conducted-events', async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const now = new Date();

            // Fetch events hosted by this group's entity that are completed or in the past
            const events = await prisma.events.findMany({
                where: {
                    hosted_by_entity_id: id,
                    OR: [
                        { status: 'completed' },
                        { ends_at: { lt: now } },
                        // If no ends_at, treat starts_at + 3h as end
                        {
                            AND: [
                                { ends_at: null },
                                { starts_at: { lt: new Date(now.getTime() - 3 * 60 * 60 * 1000) } }
                            ]
                        }
                    ]
                },
                orderBy: { starts_at: 'desc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    starts_at: true,
                    ends_at: true,
                    status: true,
                    settings: true,
                    venue: true,
                    _count: {
                        select: {
                            bookings: {
                                where: { status: 'confirmed' }
                            }
                        }
                    }
                } as any
            });

            const data = events.map((ev: any) => {
                const settings = ev.settings && typeof ev.settings === 'object' ? ev.settings : {};
                const venue = ev.venue && typeof ev.venue === 'object' ? ev.venue : {};
                const meta = venue.meta && typeof venue.meta === 'object' ? venue.meta : {};
                
                // Read cover and category from venue.meta or settings
                const cover = meta.cover || venue.cover || settings.cover || null;
                const category = meta.category || settings.category || null;

                return {
                    id: ev.id,
                    name: ev.title,
                    title: ev.title,
                    description: ev.description,
                    cover,
                    starts_at: ev.starts_at,
                    ends_at: ev.ends_at,
                    status: ev.status,
                    category,
                    attendees_count: ev._count?.bookings || 0,
                };
            });

            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });



    // GET /:id
    fastify.get('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {

        try {
            const { id } = request.params as any;
            const res = await GroupService.getGroupDetails(id, request.user);
            if (!res) {
                return reply.status(404).send({ success: false, message: 'Group not found' });
            }
            return { success: true, data: res };
        } catch (e: any) {
            if (e.message.includes('not publicly accessible') || e.message.includes('do not have access')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PUT /:id
    fastify.put('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.updateGroup(id, request.user.id, request.body);
            return { success: true, data };
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('owners can edit')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id
    fastify.delete('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await GroupService.deleteGroup(id, request.user.id);
            return { success: true, message: 'Group deleted successfully' };
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('owners can delete')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /
    fastify.get('', async (request: any, reply) => {
        try {
            let userPayload: any = null;
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const parsed = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                        const uid = parsed?.id;
                        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (uid && UUID_REGEX.test(uid)) {
                            userPayload = parsed;
                        }
                    }
                } catch (err) {}
            }
            const cityQuery = request.query.city;
            const data = await GroupService.listGroups(userPayload, cityQuery);
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/join
    fastify.post('/:id/join', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { answers } = request.body as any || {};
            
            const res = await GroupService.joinGroup(id, request.user.id, request.user.tenantId, answers);

            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'join' });
                if (res.state === 'pending') {
                    (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_join_request', { groupId: id });
                }
            }

            if (res.state === 'pending') {
                const groupEntity = await prisma.entities.findUnique({
                    where: { id },
                    select: { user_id: true }
                });
                const ownerUserId = groupEntity?.user_id;

                if (ownerUserId) {
                    const group = await prisma.groups.findUnique({
                        where: { entity_id: id }
                    });
                    const groupName = group?.name || 'group';

                    const requester = await prisma.users.findUnique({
                        where: { id: request.user.id },
                        include: { profiles: true }
                    });
                    const requesterName = requester?.profiles?.display_name || requester?.primary_email?.split('@')[0] || 'Someone';

                    const deliver = await notificationService.shouldDeliver(ownerUserId, 'JOIN_REQUESTS');
                    if (deliver) {
                        const notif = await prisma.notification_log.create({
                            data: {
                                tenant_id: request.user.tenantId || '00000000-0000-0000-0000-000000000000',
                                user_id: ownerUserId,
                                channel: 'app',
                                template_key: 'group_join_request',
                                status: 'queued',
                                provider_ref: JSON.stringify({
                                    groupId: id,
                                    groupName,
                                    requesterId: request.user.id,
                                    requesterName,
                                    answers
                                })
                            }
                        });

                        const chatNamespace = (fastify as any).io?.of('/chat');
                        if (chatNamespace) {
                            chatNamespace.to(`user:${ownerUserId}`).emit('group.notification', {
                                id: notif.id,
                                type: 'join',
                                text: `<b>${requesterName}</b> requested to join <b>${groupName}</b>`,
                                groupId: id,
                                answers
                            });
                        }
                    }
                }
            }

            if (res.state === 'active') {
                GroupService.getGroupDetails(id, request.user)
                    .then(gDetails => {
                        if (gDetails && gDetails.group) {
                            GroupNotificationService.notifyUserJoined(id, gDetails.group.name, request.user.id);
                        }
                    })
                    .catch(err => console.error('Join notification error:', err));
            }

            return { success: true, data: res, message: res.state === 'active' ? 'Joined successfully' : 'Request to join submitted' };
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('invite only') || e.message.includes('requirements to join')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            if (e.message.includes('Already requested') || e.message.includes('full capacity')) {
                return reply.status(400).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/members
    fastify.get('/:id/members', { preHandler: [(fastify as any).optionalAuthenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const { state } = request.query as any;
            const data = await GroupService.getGroupMembers(id, state, request.user);
            return { success: true, data };
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('members are hidden') || e.message.includes('Only admins can view')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:groupId/members/:memberId/questionnaire
    fastify.get('/:groupId/members/:memberId/questionnaire', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { groupId, memberId } = request.params as any;
            const data = await GroupService.getMemberQuestionnaire(groupId, memberId, request.user);
            
            reply.header('Cache-Control', 'no-store');
            return { success: true, data };
        } catch (e: any) {
            if (e.message.includes('404')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('401')) return reply.status(401).send({ success: false, message: e.message });
            if (e.message.includes('403')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/memberships/:memberId/approve
    fastify.post('/:id/memberships/:memberId/approve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;
            const data = await GroupService.approveMembership(id, memberId, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'approve_member' });
            }

            // Mark corresponding group_join_request notifications as read/acted
            const pendingNotifs = await prisma.notification_log.findMany({
                where: {
                    template_key: 'group_join_request',
                    status: { not: 'read' }
                }
            });

            for (const notif of pendingNotifs) {
                try {
                    const parsed = JSON.parse(notif.provider_ref || '{}');
                    if (parsed.groupId === id && parsed.requesterId === memberId) {
                        await prisma.notification_log.update({
                            where: { id: notif.id },
                            data: { status: 'read' }
                        });

                        const chatNamespace = (fastify as any).io?.of('/chat');
                        if (chatNamespace) {
                            chatNamespace.to(`user:${notif.user_id}`).emit('notification.acted', {
                                notificationId: notif.id,
                                action: 'accepted'
                            });
                        }
                    }
                } catch (jsonErr) {}
            }

            GroupService.getGroupDetails(id, request.user)
                .then(gDetails => {
                    if (gDetails && gDetails.group) {
                        GroupNotificationService.notifyJoinRequestApproved(id, gDetails.group.name, memberId, request.user.id);
                    }
                })
                .catch(err => console.error('Approve notification error:', err));

            return { success: true, data, message: 'Membership approved' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            if (e.message.includes('full capacity')) return reply.status(400).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/memberships/:memberId/reject
    fastify.post('/:id/memberships/:memberId/reject', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;
            const data = await GroupService.rejectMembership(id, memberId, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'reject_member' });
            }

            // Mark corresponding group_join_request notifications as read/acted
            const pendingNotifs = await prisma.notification_log.findMany({
                where: {
                    template_key: 'group_join_request',
                    status: { not: 'read' }
                }
            });

            for (const notif of pendingNotifs) {
                try {
                    const parsed = JSON.parse(notif.provider_ref || '{}');
                    if (parsed.groupId === id && parsed.requesterId === memberId) {
                        await prisma.notification_log.update({
                            where: { id: notif.id },
                            data: { status: 'read' }
                        });

                        const chatNamespace = (fastify as any).io?.of('/chat');
                        if (chatNamespace) {
                            chatNamespace.to(`user:${notif.user_id}`).emit('notification.acted', {
                                notificationId: notif.id,
                                action: 'declined'
                            });
                        }
                    }
                } catch (jsonErr) {}
            }

            GroupService.getGroupDetails(id, request.user)
                .then(gDetails => {
                    if (gDetails && gDetails.group) {
                        GroupNotificationService.notifyJoinRequestRejected(id, gDetails.group.name, memberId);
                    }
                })
                .catch(err => console.error('Reject notification error:', err));

            return { success: true, data, message: 'Membership rejected' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/memberships/:memberId/role
    fastify.patch('/:id/memberships/:memberId/role', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;
            const { role } = request.body as any;

            const res = await GroupService.updateMemberRole(id, memberId, role, request.user);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'role_update' });
            }
            return { success: true, message: res.message };
        } catch (e: any) {
            if (e.message.includes('Cannot modify') || e.message.includes('Forbidden') || e.message.includes('Admins cannot')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            if (e.message.includes('Invalid role')) return reply.status(400).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/memberships/:memberId
    fastify.delete('/:id/memberships/:memberId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;
            await GroupService.removeMember(id, memberId, request.user);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'remove_member' });
            }
            return { success: true, message: 'Member removed successfully' };
        } catch (e: any) {
            if (e.message.includes('Cannot remove') || e.message.includes('Forbidden') || e.message.includes('Admins cannot')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/leave
    fastify.post('/:id/leave', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await GroupService.leaveGroup(id, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'leave_member', userId: request.user.id });
            }
            return { success: true, message: 'Left group successfully' };
        } catch (e: any) {
            if (e.message.includes('Not a member') || e.message.includes('Owner cannot leave')) {
                return reply.status(400).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/join/cancel
    fastify.post('/:id/join/cancel', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await GroupService.cancelJoinRequest(id, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'cancel_join_request', userId: request.user.id });
            }
            return { success: true, message: 'Join request cancelled successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/visibility
    fastify.patch('/:id/visibility', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { visibility } = request.body as any;
            const data = await GroupService.updateVisibility(id, visibility, request.user.id);
            return { success: true, message: 'Visibility updated', data };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/archive
    fastify.post('/:id/archive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.archiveGroup(id, request.user.id);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('groups_updated', { action: 'archive_group' });
            }
            return { success: true, data, message: 'Group archived' };
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('owners can archive')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/unarchive
    fastify.post('/:id/unarchive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.unarchiveGroup(id, request.user.id);
            return { success: true, data, message: 'Group unarchived' };
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('owners can unarchive')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/posts
    fastify.get('/:id/posts', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const data = await GroupService.getGroupPosts(id, request.query, request.user);
            return { success: true, data };
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('posts are hidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts
    fastify.post('/:id/posts', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.createGroupPost(id, request.user, request.body);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_thread', { groupId: id, postId: (data as any).id });
            
            // Trigger notifications asynchronously
            GroupService.getGroupDetails(id, request.user)
                .then(groupDetails => {
                    if (groupDetails && groupDetails.group) {
                        return GroupNotificationService.notifyNewPost(
                            id,
                            groupDetails.group.name,
                            (data as any).id,
                            request.body.title || 'Untitled Post',
                            request.user.id
                        );
                    }
                })
                .catch(err => console.error('New post notification error:', err));

            return reply.status(201).send({ success: true, data, message: 'Post created' });
        } catch (e: any) {
            if (e.message.includes('Group not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('disabled') || e.message.includes('do not have permission')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId
    fastify.patch('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            await GroupService.editGroupPost(id, postId, request.user, request.body);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_edited', { groupId: id, postId });
            return { success: true, message: 'Post updated' };
        } catch (e: any) {
            if (e.message.includes('Post not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('Only author') || e.message.includes('expired')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/posts/:postId
    fastify.delete('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            await GroupService.deleteGroupPost(id, postId, request.user);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_deleted', { groupId: id, postId });
            return { success: true, message: 'Post deleted' };
        } catch (e: any) {
            if (e.message.includes('Post not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/posts/:postId
    fastify.get('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id, postId } = request.params as any;
            const data = await GroupService.getGroupPost(id, postId, request.user);
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
            const data = await GroupService.createGroupComment(id, postId, request.user, request.body);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_comment', { groupId: id, postId, commentId: (data as any).id });
            
            // Trigger notifications asynchronously
            GroupService.getGroupDetails(id, request.user)
                .then(groupDetails => {
                    if (groupDetails && groupDetails.group) {
                        const activityType = request.body.parent_id || request.body.parentId ? 'reply' : 'comment';
                        return GroupNotificationService.notifyPostActivity(
                            id,
                            groupDetails.group.name,
                            postId,
                            request.user.id,
                            activityType
                        );
                    }
                })
                .catch(err => console.error('Post comment notification error:', err));

            return reply.status(201).send({ success: true, data, message: 'Reply added' });
        } catch (e: any) {
            if (e.message.includes('Thread not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('locked') || e.message.includes('disabled') || e.message.includes('permission to reply')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/comments/:commentId
    fastify.patch('/:id/posts/:postId/comments/:commentId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId, commentId } = request.params as any;
            await GroupService.editGroupComment(id, postId, commentId, request.user, request.body);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_edited', { groupId: id, postId, commentId });
            return { success: true, message: 'Comment updated' };
        } catch (e: any) {
            if (e.message.includes('Comment not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('Only author') || e.message.includes('expired')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/posts/:postId/comments/:commentId
    fastify.delete('/:id/posts/:postId/comments/:commentId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId, commentId } = request.params as any;
            await GroupService.deleteGroupComment(id, postId, commentId, request.user);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_deleted', { groupId: id, postId, commentId });
            return { success: true, message: 'Comment deleted' };
        } catch (e: any) {
            if (e.message.includes('Comment not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/vote
    fastify.post('/:id/posts/:postId/vote', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { vote } = request.body as any;
            const data = await GroupService.voteGroupPost(id, postId, request.user, vote);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_voted', { groupId: id, postId, score: data.vote_score });
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
            const data = await GroupService.voteGroupComment(id, commentId, request.user, vote);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_voted', { groupId: id, postId, commentId, score: data.vote_score });
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
            const reactions = await GroupService.reactGroupPost(id, postId, request.user, emoji);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_reacted', { groupId: id, postId, reactions });
            
            // Trigger notifications asynchronously
            GroupService.getGroupDetails(id, request.user)
                .then(groupDetails => {
                    if (groupDetails && groupDetails.group) {
                        return GroupNotificationService.notifyPostActivity(
                            id,
                            groupDetails.group.name,
                            postId,
                            request.user.id,
                            'reaction'
                        );
                    }
                })
                .catch(err => console.error('Post reaction notification error:', err));

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
            await GroupService.solveGroupPost(id, postId, request.user, solved);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_solved', { groupId: id, postId, solved });
            }
            return { success: true, message: solved ? 'Marked as solved' : 'Unmarked as solved' };
        } catch (e: any) {
            if (e.message.includes('Post not found')) return reply.status(404).send({ success: false, message: e.message });
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/archive
    fastify.patch('/:id/posts/:postId/archive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { archived } = request.body as any;
            await GroupService.archiveGroupPost(id, postId, request.user, archived);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_archived', { groupId: id, postId, archived });
            }
            return { success: true, message: archived ? 'Thread archived' : 'Thread unarchived' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/pin
    fastify.patch('/:id/posts/:postId/pin', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { pinned } = request.body as any;
            await GroupService.pinGroupPost(id, postId, request.user, pinned);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_pinned', { groupId: id, postId, pinned });
            }
            return { success: true, message: pinned ? 'Post pinned' : 'Post unpinned' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/lock
    fastify.patch('/:id/posts/:postId/lock', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { locked } = request.body as any;
            await GroupService.lockGroupPost(id, postId, request.user, locked);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_locked', { groupId: id, postId, locked });
            }
            return { success: true, message: locked ? 'Post locked' : 'Post unlocked' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/tags
    fastify.get('/:id/tags', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const data = await GroupService.listGroupTags(id);
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/tags
    fastify.post('/:id/tags', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { name, color } = request.body as any;
            const data = await GroupService.createGroupTag(id, request.user, name, color);
            return reply.status(201).send({ success: true, data });
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/tags/:tagId
    fastify.delete('/:id/tags/:tagId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, tagId } = request.params as any;
            await GroupService.deleteGroupTag(id, tagId, request.user);
            return { success: true, message: 'Tag deleted' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/dashboard-stats
    fastify.get('/:id/dashboard-stats', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.getDashboardStats(id, request.user);
            return { success: true, data };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/forum-members
    fastify.get('/:id/forum-members', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.getForumMembers(id, request.user);
            return { success: true, data };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/forum-members
    fastify.post('/:id/forum-members', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            await GroupService.addForumMemberPermission(id, request.user, request.body);
            return reply.status(201).send({ success: true, message: 'Permission granted' });
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/forum-members/:userId/:permType
    fastify.delete('/:id/forum-members/:userId/:permType', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, userId, permType } = request.params as any;
            await GroupService.removeForumMemberPermission(id, userId, permType, request.user);
            return { success: true, message: 'Permission revoked' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/gallery — public groups allow unauthenticated/non-member read
    fastify.get('/:id/gallery', { preHandler: [(fastify as any).optionalAuthenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const isAdmin = request.user ? await GroupService.verifyGroupAdmin(request.user.id, id) : false;
            const data = await GroupService.getGroupGallery(id, request.user, isAdmin);
            return reply.send({ success: true, data, callerIsAdmin: isAdmin });
        } catch (e: any) {
            if (e.message?.includes('members only') || e.message?.includes('not a member')) {
                return reply.status(403).send({ success: false, message: e.message });
            }
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/gallery
    fastify.post('/:id/gallery', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.uploadToGallery(id, request.user, request.body);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('gallery_updated', { groupId: id, action: 'upload', itemId: data.id });
            }
            return reply.send({ success: true, data });
        } catch (e: any) {
            if (e.message.includes('Members only')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/gallery/:itemId/approve
    fastify.patch('/:id/gallery/:itemId/approve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, itemId } = request.params as any;
            await GroupService.approveGalleryItem(id, itemId, request.user);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('gallery_updated', { groupId: id, action: 'approve', itemId });
            }
            return reply.send({ success: true });
        } catch (e: any) {
            if (e.message.includes('Admins only')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/gallery/:itemId
    fastify.delete('/:id/gallery/:itemId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, itemId } = request.params as any;
            await GroupService.deleteGalleryItem(id, itemId, request.user);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('gallery_updated', { groupId: id, action: 'remove', itemId });
            }
            return reply.send({ success: true });
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/settings
    fastify.patch('/:id/settings', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { settings } = request.body as any;
            await GroupService.updateSettings(id, settings, request.user);
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'settings_update' });
            }
            return { success: true, message: 'Settings updated' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/invites
    fastify.get('/:id/invites', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const data = await GroupService.getGroupInvites(id, request.user);
            return { success: true, data };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/invites
    fastify.post('/:id/invites', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { targets } = request.body as any;
            if (!(await GroupService.verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }
            const data = await InvitationService.createInvitations(id, request.user.id, targets || []);
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/invites/link
    fastify.post('/:id/invites/link', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { maxUses, expiryHours } = request.body as any;
            if (!(await GroupService.verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }
            const data = await InvitationService.createShareableLink(id, request.user.id, { maxUses, expiryHours });
            return { success: true, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/invites/:inviteId
    fastify.delete('/:id/invites/:inviteId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, inviteId } = request.params as any;
            await GroupService.revokeGroupInvite(id, inviteId, request.user);
            return { success: true, message: 'Invitation revoked' };
        } catch (e: any) {
            if (e.message.includes('Forbidden')) return reply.status(403).send({ success: false, message: e.message });
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /invite/:token
    fastify.get('/invite/:token', async (request: any, reply) => {
        try {
            const { token } = request.params as any;
            let userId = undefined;
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const jwt = require('jsonwebtoken');
                    const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET || 'secret');
                    userId = decoded.id;
                } catch (err) {}
            }
            const validation = await InvitationService.validateInvite(token, userId);
            if (!validation.valid) {
                return { success: false, message: validation.message, invite: validation.invite };
            }
            return {
                success: true,
                data: {
                    invite: validation.invite,
                    group: GroupService.toClientGroup(validation.invite?.groups),
                    isAlreadyMember: (validation as any).isAlreadyMember,
                    membershipState: (validation as any).membershipState
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /invite/:token/accept
    fastify.post('/invite/:token/accept', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { token } = request.params as any;
            const body = (request.body as any) || {};
            const answers = body.answers || {};

            const result = await InvitationService.acceptInvite(token, request.user.id, request.user.tenantId, answers);
            if ((result as any).requiresQuestionnaire) {
                return { success: true, requiresQuestionnaire: true, data: result };
            }
            const memberState = (result as any).membershipState;
            const message = memberState === 'pending' ? 'Join request submitted for approval' : 'Invitation accepted';
            
            if ((fastify as any).io && (result as any).inviteGroupId) {
                const id = (result as any).inviteGroupId;
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'join' });
                if (memberState === 'pending') {
                    (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_join_request', { groupId: id });
                }
            }

            return { success: true, data: result, message };
        } catch (e: any) {
            return reply.status(400).send({ success: false, message: e.message });
        }
    });

};

export default groupRoutes;
