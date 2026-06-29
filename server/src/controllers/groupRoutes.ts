import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import { InvitationService } from '../services/InvitationService';

export const groupRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    const toClientGroup = (dbGroup: any) => {
        const id = dbGroup.entity_id;
        const bannerUrl = dbGroup.banner_data ? `/api/groups/${id}/banner` : (dbGroup.banner && !dbGroup.banner.startsWith('blob:') ? dbGroup.banner : null);
        const iconUrl = dbGroup.icon_data ? `/api/groups/${id}/icon` : (dbGroup.icon && !dbGroup.icon.startsWith('blob:') ? dbGroup.icon : null);
        return {
            id,
            name: dbGroup.name,
            slug: dbGroup.slug,
            description: dbGroup.description,
            category: dbGroup.category,
            icon: iconUrl,
            cover: dbGroup.cover,
            banner: bannerUrl,
            joinMode: dbGroup.join_mode,
            joinFormId: dbGroup.join_form_id,
            listed: dbGroup.listed,
            visibility: dbGroup.entities?.visibility,
            createdAt: dbGroup.entities?.created_at,
            settings: dbGroup.settings,
        };
    };

    const parseDataUri = (dataUri: string): { buffer: Buffer; mimeType: string } | null => {
        const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return null;
        return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
    };

    const toUint8 = (buf: Buffer): Uint8Array<ArrayBuffer> => new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) as Uint8Array<ArrayBuffer>;

    const detectMime = (data: Uint8Array | Buffer): string => {
        const b = Buffer.from(data);
        if (b[0] === 0xFF && b[1] === 0xD8) return 'image/jpeg';
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
        if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return 'image/webp';
        return 'image/jpeg';
    };

    const getUserMembership = async (userId: string, groupId: string) => {
        const [membership, roles] = await Promise.all([
            prisma.group_memberships.findUnique({
                where: { group_id_user_id: { group_id: groupId, user_id: userId } }
            }),
            prisma.role_assignments.findMany({
                where: { user_id: userId, scope_entity_id: groupId, roles: { key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } } },
                include: { roles: true }
            })
        ]);
        
        const roleKeys = roles.map(r => r.roles.key);
        return {
            state: membership?.state || null,
            roles: roleKeys,
            isOwner: roleKeys.includes('group_owner')
        };
    };

    // POST /
    fastify.post('', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            
            const body = request.body;
            const userId = request.user.id;
            const tenantId = request.user.tenantId;

            if (!body.name) {
                return reply.status(400).send({ success: false, message: 'Name is required' });
            }

            const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            // Parse binary data from data-URIs before the transaction
            const bannerParsed = body.banner && body.banner.startsWith('data:') ? parseDataUri(body.banner) : null;
            const iconParsed = body.icon && body.icon.startsWith('data:') ? parseDataUri(body.icon) : null;

            // Transaction to create entity and group
            const result = await prisma.$transaction(async (tx) => {
                const rawVis = body.visibility || 'public';
                const entityVisibility = rawVis === 'hidden' ? 'private' : rawVis;
                const entity = await tx.entities.create({
                    data: {
                        tenant_id: tenantId,
                        entity_type: 'group',
                        user_id: userId,
                        visibility: entityVisibility as any
                    }
                });

                const group = await tx.groups.create({
                    data: {
                        entity_id: entity.id,
                        name: body.name,
                        slug: slug,
                        description: body.description || null,
                        category: body.category || null,
                        icon: iconParsed ? null : (body.icon || null),
                        icon_data: iconParsed ? toUint8(iconParsed.buffer) : undefined,
                        cover: body.cover || null,
                        banner: bannerParsed ? null : (body.banner || null),
                        banner_data: bannerParsed ? toUint8(bannerParsed.buffer) : undefined,
                        join_mode: body.joinMode || 'open',
                        listed: body.listed || 'unlisted',
                        settings: body.settings || {}
                    }
                });

                await tx.group_memberships.create({
                    data: {
                        tenant_id: tenantId,
                        group_id: entity.id,
                        user_id: userId,
                        state: 'active',
                        joined_at: new Date()
                    }
                });

                const ownerRole = await tx.roles.findUnique({ where: { key: 'group_owner' } });
                if (ownerRole) {
                    await tx.role_assignments.create({
                        data: {
                            tenant_id: tenantId,
                            user_id: userId,
                            role_id: ownerRole.id,
                            scope_entity_id: entity.id,
                            granted_by: userId
                        }
                    });
                }

                return { ...group, entities: entity };
            });

            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('groups_updated', { action: 'new_group' });
            }
            return reply.status(201).send({ success: true, data: toClientGroup(result), message: 'Group created' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /my
    fastify.get('/my', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const userId = request.user.id;

            const memberships = await prisma.group_memberships.findMany({
                where: { user_id: userId }
            });

            const groupIds = memberships.map((m: any) => m.group_id);

            const userGroups = await prisma.groups.findMany({
                where: { entity_id: { in: groupIds } },
                include: { entities: true }
            });
            const groupMap = new Map(userGroups.map((g: any) => [g.entity_id, g]));

            const roles = await prisma.role_assignments.findMany({
                where: { user_id: userId, roles: { key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } } },
                include: { roles: true }
            });

            const rolesByGroup = roles.reduce((acc: any, curr: any) => {
                const gid = curr.scope_entity_id;
                if (!gid) return acc;
                if (!acc[gid]) acc[gid] = [];
                acc[gid].push(curr.roles.key);
                return acc;
            }, {});

            const ownedGroups: any[] = [];
            const joinedGroups: any[] = [];
            const pendingGroups: any[] = [];
            const draftGroups: any[] = [];
            const archivedGroups: any[] = [];

            const membershipCounts = await prisma.group_memberships.groupBy({
                by: ['group_id'],
                where: { group_id: { in: groupIds }, state: 'active' },
                _count: { _all: true }
            });
            const countsMap = new Map(membershipCounts.map((m: any) => [m.group_id, m._count._all]));

            for (const m of memberships) {
                const g = groupMap.get(m.group_id);
                if (!g) continue;
                const clientGroup = { ...toClientGroup(g), members: countsMap.get(g.entity_id) || 0 };
                const gRoles = rolesByGroup[m.group_id] || [];
                const enhancedGroup = { ...clientGroup, membershipState: m.state, isOwner: gRoles.includes('group_owner') };

                const settings = g.settings as any || {};
                if (settings.isDraft && enhancedGroup.isOwner) {
                    draftGroups.push(enhancedGroup);
                } else if (settings.isArchived && enhancedGroup.isOwner) {
                    archivedGroups.push(enhancedGroup);
                } else if (enhancedGroup.isOwner) {
                    ownedGroups.push(enhancedGroup);
                } else if (m.state === 'active') {
                    joinedGroups.push(enhancedGroup);
                } else if (m.state === 'pending') {
                    pendingGroups.push(enhancedGroup);
                }
            }

            return { success: true, data: { ownedGroups, joinedGroups, pendingGroups, draftGroups, archivedGroups } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /my-managed — groups where current user is owner, admin, or moderator
    fastify.get('/my-managed', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const userId = request.user.id;

            const adminRoles = ['group_owner', 'group_admin', 'group_moderator'];
            const roleAssignments = await prisma.role_assignments.findMany({
                where: { user_id: userId, roles: { key: { in: adminRoles } } },
                include: { roles: true }
            });

            const groupIds = [...new Set(roleAssignments.map((r: any) => r.scope_entity_id).filter(Boolean))];
            if (groupIds.length === 0) return reply.send({ success: true, data: [] });

            const groups = await prisma.groups.findMany({
                where: { entity_id: { in: groupIds } },
                include: { entities: true }
            });

            const data = groups.map((g: any) => ({
                id: g.entity_id,
                name: g.entities?.name || g.name,
                category: g.category
            }));

            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/banner — serve banner image binary
    fastify.get('/:id/banner', async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const group = await prisma.groups.findUnique({ where: { entity_id: id }, select: { banner_data: true, banner: true } });
            if (!group) return reply.status(404).send('Not found');
            if (group.banner_data) {
                const buf = Buffer.from(group.banner_data);
                reply.header('Content-Type', detectMime(buf));
                reply.header('Cache-Control', 'public, max-age=86400');
                return reply.send(buf);
            }
            if (group.banner && !group.banner.startsWith('blob:')) return reply.redirect(group.banner);
            return reply.status(404).send('No banner');
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/icon — serve icon image binary
    fastify.get('/:id/icon', async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const group = await prisma.groups.findUnique({ where: { entity_id: id }, select: { icon_data: true, icon: true } });
            if (!group) return reply.status(404).send('Not found');
            if (group.icon_data) {
                const buf = Buffer.from(group.icon_data);
                reply.header('Content-Type', detectMime(buf));
                reply.header('Cache-Control', 'public, max-age=86400');
                return reply.send(buf);
            }
            if (group.icon && !group.icon.startsWith('blob:') && !group.icon.startsWith('/api/')) return reply.redirect(group.icon);
            return reply.status(404).send('No icon');
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id
    fastify.get('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const group = await prisma.groups.findUnique({
                where: { entity_id: id },
                include: { entities: true }
            });

            if (!group) {
                return reply.status(404).send({ success: false, message: 'Group not found' });
            }

            let membershipState = null;
            let isOwner = false;

            if (request.user) {
                const membership = await getUserMembership(request.user.id, id);
                membershipState = membership.state;
                isOwner = membership.isOwner;
            }

            if (group.entities?.visibility === 'private') {
                if (!request.user) return reply.status(403).send({ success: false, message: 'This group is not publicly accessible' });
                // Members (active or pending) and owners can always view
                let allowed = isOwner || membershipState === 'active' || membershipState === 'pending';
                if (!allowed) {
                    const settings: any = group.settings || {};
                    const joinElig = settings.joinElig || 'anyone';
                    if (joinElig === 'restricted') {
                        // Restricted-access group: check group/community membership requirements
                        const reqGroups: string[] = settings.restrictedAccess?.visibility?.groups || [];
                        const reqCommunities: string[] = settings.restrictedAccess?.visibility?.communities || [];
                        if (reqGroups.length > 0) {
                            const grpMem = await prisma.group_memberships.findFirst({
                                where: { user_id: request.user.id, state: 'active', entities: { groups: { name: { in: reqGroups } } } }
                            });
                            if (grpMem) allowed = true;
                        }
                        if (!allowed && reqCommunities.length > 0) {
                            const catMem = await prisma.group_memberships.findFirst({
                                where: { user_id: request.user.id, state: 'active', entities: { groups: { category: { in: reqCommunities } } } }
                            });
                            if (catMem) allowed = true;
                        }
                    } else {
                        // Unlisted group: any authenticated user with the link can view
                        allowed = true;
                    }
                }
                if (!allowed) {
                    return reply.status(403).send({ success: false, message: 'You do not have access to view this group' });
                }
            }

            const activeMemberships = await prisma.group_memberships.findMany({
                where: { group_id: id, state: 'active' }
            });

            const userIds = activeMemberships.map((m: any) => m.user_id);

            const activeUsers = await prisma.users.findMany({
                where: { id: { in: userIds } },
                select: { id: true, first_name: true, last_name: true, primary_email: true }
            });

            const usersMap = new Map(activeUsers.map((u: any) => [u.id, u]));
            
            const groupRoles = await prisma.role_assignments.findMany({
                where: { scope_entity_id: id }
            });
            const rolesByUser = groupRoles.reduce((acc: any, curr: any) => {
                if (!acc[curr.user_id]) acc[curr.user_id] = [];
                acc[curr.user_id].push(curr.role_id);
                return acc;
            }, {});

            const ownerRole = await prisma.roles.findUnique({ where: { key: 'group_owner' }});
            const adminRole = await prisma.roles.findUnique({ where: { key: 'group_admin' }});
            const modRole = await prisma.roles.findUnique({ where: { key: 'group_moderator' }});

            const members = activeMemberships.map((m: any) => {
                const userRoles = rolesByUser[m.user_id] || [];
                let role = 'member';
                if (ownerRole && userRoles.includes(ownerRole.id)) role = 'owner';
                else if (adminRole && userRoles.includes(adminRole.id)) role = 'admin';
                else if (modRole && userRoles.includes(modRole.id)) role = 'moderator';
                
                const u = usersMap.get(m.user_id);
                let name = 'Unknown User';
                let username = 'unknown';
                if (u) {
                    username = u.primary_email ? u.primary_email.split('@')[0] : 'unknown';
                    const fn = u.first_name || '';
                    const ln = u.last_name || '';
                    const full = `${fn} ${ln}`.trim();
                    name = full || username || 'Unknown User';
                }
                
                return {
                    id: m.user_id,
                    name,
                    username,
                    role
                };
            });

            if (group.entities?.visibility === 'private' && membershipState !== 'active' && !isOwner) {
                return { success: true, data: { ...toClientGroup(group), membershipState, isOwner, members: [] } };
            }
            return { success: true, data: { ...toClientGroup(group), membershipState, isOwner, members } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PUT /:id
    fastify.put('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const userId = request.user.id;
            const { name, description, category, icon, cover, banner, joinMode, visibility, listed, settings } = request.body as any;

            const group = await prisma.groups.findUnique({
                where: { entity_id: id },
                include: { entities: true }
            });

            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            const ownerRole = await prisma.roles.findUnique({ where: { key: 'group_owner' } });
            const isOwner = ownerRole ? !!(await prisma.role_assignments.findFirst({
                where: { user_id: userId, scope_entity_id: id, role_id: ownerRole.id }
            })) : false;

            if (!isOwner) {
                return reply.status(403).send({ success: false, message: 'Only group owners can edit the group' });
            }

            const bannerParsed = banner && banner.startsWith('data:') ? parseDataUri(banner) : null;
            const iconParsed = icon && icon.startsWith('data:') ? parseDataUri(icon) : null;

            const updatedGroup = await prisma.groups.update({
                where: { entity_id: id },
                data: {
                    name: name ?? group.name,
                    description: description ?? group.description,
                    category: category ?? group.category,
                    icon: iconParsed ? null : (icon !== undefined ? icon : group.icon),
                    icon_data: iconParsed ? toUint8(iconParsed.buffer) : undefined,
                    cover: cover ?? group.cover,
                    banner: bannerParsed ? null : (banner !== undefined ? banner : group.banner),
                    banner_data: bannerParsed ? toUint8(bannerParsed.buffer) : undefined,
                    join_mode: joinMode ?? group.join_mode,
                    listed: listed ?? group.listed,
                    settings: settings ?? group.settings,
                    entities: visibility ? {
                        update: { visibility: (visibility === 'hidden' ? 'private' : visibility) as any }
                    } : undefined
                },
                include: { entities: true }
            });

            return { success: true, data: toClientGroup(updatedGroup) };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id
    fastify.delete('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const userId = request.user.id;

            const group = await prisma.groups.findUnique({ where: { entity_id: id } });
            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            const ownerRole = await prisma.roles.findUnique({ where: { key: 'group_owner' } });
            const isOwner = ownerRole ? !!(await prisma.role_assignments.findFirst({
                where: { user_id: userId, scope_entity_id: id, role_id: ownerRole.id }
            })) : false;

            if (!isOwner) {
                return reply.status(403).send({ success: false, message: 'Only group owners can delete the group' });
            }

            // Prisma will fail if we don't delete relationships first because migrations might not have ON DELETE CASCADE for everything in prisma schema
            await prisma.$transaction([
                prisma.group_memberships.deleteMany({ where: { group_id: id } }),
                prisma.role_assignments.deleteMany({ where: { scope_entity_id: id } }),
                prisma.groups.delete({ where: { entity_id: id } }),
                prisma.entities.delete({ where: { id: id } })
            ]);

            return { success: true, message: 'Group deleted successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /
    fastify.get('', async (request: any, reply) => {
        try {
            const groups = await prisma.groups.findMany({
                where: { entities: { visibility: 'public' } },
                include: { entities: true },
                orderBy: { entities: { created_at: 'desc' } }
            });

            const membershipCounts = await prisma.group_memberships.groupBy({
                by: ['group_id'],
                where: { state: 'active' },
                _count: { _all: true }
            });
            const countsMap = new Map(membershipCounts.map((m: any) => [m.group_id, m._count._all]));

            const publishedGroups = groups.filter((g: any) => {
                const s = (g.settings as any) || {};
                return !s.isDraft && !s.isArchived;
            });
            return { success: true, data: publishedGroups.map((g: any) => ({ ...toClientGroup(g), members: countsMap.get(g.entity_id) || 0 })) };
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
            const userId = request.user.id;
            const tenantId = request.user.tenantId;

            const group = await prisma.groups.findUnique({ where: { entity_id: id } });
            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            const existing = await prisma.group_memberships.findUnique({
                where: { group_id_user_id: { group_id: id, user_id: userId } }
            });

            if (existing) {
                if (existing.state === 'rejected') {
                    // Rejected users may re-apply — remove stale record so the flow continues
                    await prisma.group_memberships.delete({ where: { group_id_user_id: { group_id: id, user_id: userId } } });
                } else {
                    return reply.status(400).send({ success: false, message: 'Already requested or joined' });
                }
            }

            if (group.join_mode === 'invite_only') {
                return reply.status(403).send({ success: false, message: 'This group is invite only' });
            }

            const settings = group.settings as any || {};

            const joinElig = settings.joinElig || 'anyone';
            if (joinElig === 'restricted') {
                let allowed = false;
                // Check if the user's entity ID is in the allowed members list
                const reqEnts = settings.restrictedAccess?.join?.selectedMembers || [];
                if (reqEnts.length > 0) {
                    const entIds = reqEnts.map((e: any) => e.id).filter(Boolean);
                    if (entIds.includes(userId)) allowed = true;
                }
                // Check if user is a member of any required group
                if (!allowed) {
                    const reqGroups: string[] = settings.restrictedAccess?.join?.restricted?.groups || [];
                    if (reqGroups.length > 0) {
                        const grpMem = await prisma.group_memberships.findFirst({
                            where: { user_id: userId, state: 'active', entities: { groups: { name: { in: reqGroups } } } }
                        });
                        if (grpMem) allowed = true;
                    }
                }
                // Check if user is a member of a group in any required community/category
                if (!allowed) {
                    const reqCommunities: string[] = settings.restrictedAccess?.join?.restricted?.communities || [];
                    if (reqCommunities.length > 0) {
                        const catMem = await prisma.group_memberships.findFirst({
                            where: { user_id: userId, state: 'active', entities: { groups: { category: { in: reqCommunities } } } }
                        });
                        if (catMem) allowed = true;
                    }
                }
                if (!allowed) {
                    return reply.status(403).send({ success: false, message: 'You do not meet the requirements to join this group' });
                }
            }
            const capacity = settings.capacity || {};
            let isWaitlisted = false;

            if (capacity.limit === true && capacity.max > 0) {
                const activeCount = await prisma.group_memberships.count({
                    where: { group_id: id, state: 'active' }
                });

                if (activeCount >= capacity.max) {
                    if (capacity.waitlist === true) {
                        isWaitlisted = true;
                    } else {
                        return reply.status(400).send({ success: false, message: 'Group is at full capacity' });
                    }
                }
            }

            const newState = isWaitlisted ? 'pending' : (group.join_mode === 'open' ? 'active' : 'pending');
            
            const membership = await prisma.group_memberships.create({
                data: {
                    tenant_id: tenantId,
                    group_id: id,
                    user_id: userId,
                    state: newState,
                    answers: answers && Object.keys(answers).length > 0 ? answers : null,
                    joined_at: newState === 'active' ? new Date() : null
                }
            });

            // Broadcast real-time update
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'join' });
                if (newState === 'pending') {
                    (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_join_request', { groupId: id });
                }
            }

            return { success: true, data: { state: newState }, message: newState === 'active' ? 'Joined successfully' : 'Request to join submitted' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/members
    fastify.get('/:id/members', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const { state } = request.query as any;

            const group = await prisma.groups.findUnique({ where: { entity_id: id }, include: { entities: true } });
            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            if (group.entities?.visibility === 'private') {
                if (!request.user) return reply.status(403).send({ success: false, message: 'Private group members are hidden' });
                const membership = await getUserMembership(request.user.id, id);
                if (membership.state !== 'active' && !membership.isOwner) {
                    return reply.status(403).send({ success: false, message: 'Private group members are hidden' });
                }
            }
            
            // Only admins/owners may see pending members; everyone else sees active only
            const requestingUser = request.user;
            let callerIsAdmin = false;
            if (requestingUser) {
                const callerMem = await getUserMembership(requestingUser.id, id);
                callerIsAdmin = callerMem.isOwner || ['group_admin', 'group_moderator'].includes(
                    (callerMem.roles || []).find((r: string) => ['group_admin', 'group_moderator'].includes(r)) || ''
                );
            }

            const filter: any = { group_id: id };
            if (state) {
                if (state === 'pending' && !callerIsAdmin) {
                    return reply.status(403).send({ success: false, message: 'Only admins can view pending members' });
                }
                filter.state = state;
            } else if (!callerIsAdmin) {
                filter.state = 'active'; // non-admins only see active members
            }

            const members = await prisma.group_memberships.findMany({
                where: filter,
                include: { users: { select: { first_name: true, last_name: true, id: true, primary_email: true } } }
            });

            const userIds = members.map(m => m.user_id);
            const roleAssignments = await prisma.role_assignments.findMany({
                where: { scope_entity_id: id, user_id: { in: userIds } },
                include: { roles: true }
            });

            const rolesByUser = roleAssignments.reduce((acc: any, ra) => {
                if (!acc[ra.user_id]) acc[ra.user_id] = [];
                acc[ra.user_id].push(ra.roles.key);
                return acc;
            }, {});

            const membersWithRoles = members.map(m => {
                const username = m.users?.primary_email ? m.users.primary_email.split('@')[0] : 'unknown';
                const displayName = m.users ? `${m.users.first_name || ''} ${m.users.last_name || ''}`.trim() : username;
                return {
                    ...m,
                    users: m.users ? { ...m.users, display_name: displayName || username, username } : null,
                    roles: rolesByUser[m.user_id] || ['group_member']
                };
            });

            return { success: true, data: membersWithRoles };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    const getHighestGroupRole = async (userId: string, groupId: string): Promise<string> => {
        const entity = await prisma.entities.findUnique({ where: { id: groupId } });
        if (entity?.user_id === userId) return 'group_owner';
        
        const assignments = await prisma.role_assignments.findMany({
            where: { user_id: userId, scope_entity_id: groupId },
            include: { roles: true }
        });
        
        const roles = assignments.map(a => a.roles.key);
        if (roles.includes('group_owner')) return 'group_owner';
        if (roles.includes('group_admin')) return 'group_admin';
        if (roles.includes('group_moderator')) return 'group_moderator';
        
        const membership = await prisma.group_memberships.findUnique({
            where: { group_id_user_id: { group_id: groupId, user_id: userId } }
        });
        if (membership?.state === 'active') return 'group_member';
        return 'none';
    };

    const verifyGroupAdmin = async (userId: string, groupId: string) => {
        const role = await getHighestGroupRole(userId, groupId);
        return ['group_owner', 'group_admin', 'group_moderator'].includes(role);
    };

    // Check forum-specific permission: 'everyone' | 'members' | 'admins' | 'selected'
    const checkForumPermission = async (userId: string, groupId: string, permType: 'create_thread' | 'reply_thread', settings: any): Promise<boolean> => {
        const perm = permType === 'create_thread'
            ? (settings?.forums?.threadPerm || 'everyone')
            : (settings?.forums?.replyPerm || 'everyone');
        const membership = await getUserMembership(userId, groupId);
        if (membership.isOwner) return true;
        // Non-members (state !== 'active') can never post regardless of perm setting
        if (membership.state !== 'active') return false;
        if (perm === 'everyone') return true;
        if (perm === 'members') return true;
        if (perm === 'admins') {
            const roles = membership.roles || [];
            return roles.some((r: string) => ['group_admin', 'group_moderator'].includes(r));
        }
        if (perm === 'selected') {
            const res: any[] = await prisma.$queryRawUnsafe(
                `SELECT id FROM forum_member_permissions WHERE group_id=$1::uuid AND user_id=$2::uuid AND perm_type=$3 LIMIT 1`,
                groupId, userId, permType
            );
            return res.length > 0;
        }
        return false;
    };

    // Build nested comment tree from flat recursive-CTE result
    const buildCommentTree = (flat: any[]): any[] => {
        const map = new Map<string, any>();
        flat.forEach(c => map.set(String(c.id), { ...c, replies: [] }));
        const roots: any[] = [];
        flat.forEach(c => {
            if (c.parent_id) {
                const parent = map.get(String(c.parent_id));
                if (parent) parent.replies.push(map.get(String(c.id)));
            } else {
                roots.push(map.get(String(c.id)));
            }
        });
        return roots;
    };

    const tagColorMap: Record<string, string> = {
        Question: 'blue', Announcement: 'orange', Help: 'purple', Bug: 'red',
        Feature: 'green', News: 'cyan', Discussion: 'gray', General: 'gray'
    };

    const mapCommentAuthor = (c: any) => {
        const username = c.primary_email ? c.primary_email.split('@')[0] : 'unknown';
        const name = c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : username;
        return { ...c, author_name: name, author_username: username, first_name: undefined, last_name: undefined, primary_email: undefined };
    };

    // POST /:id/memberships/:memberId/approve
    fastify.post('/:id/memberships/:memberId/approve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }
            const membership = await prisma.group_memberships.update({
                where: { group_id_user_id: { group_id: id, user_id: memberId } },
                data: { state: 'active', joined_at: new Date() }
            });
            
            // Broadcast real-time update
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'approve_member' });
            }

            return { success: true, data: membership, message: 'Membership approved' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/memberships/:memberId/reject
    fastify.post('/:id/memberships/:memberId/reject', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }
            const membership = await prisma.group_memberships.update({
                where: { group_id_user_id: { group_id: id, user_id: memberId } },
                data: { state: 'rejected' }
            });
            
            // Broadcast real-time update
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'reject_member' });
            }

            return { success: true, data: membership, message: 'Membership rejected' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });



    // PATCH /:id/memberships/:memberId/role
    fastify.patch('/:id/memberships/:memberId/role', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;
            const { role } = request.body as any;

            if (request.user.id === memberId) {
                return reply.status(403).send({ success: false, message: 'Cannot modify your own role' });
            }

            const group = await prisma.groups.findUnique({ where: { entity_id: id } });
            const requesterRole = await getHighestGroupRole(request.user.id, id);
            const targetRole = await getHighestGroupRole(memberId, id);

            if (requesterRole === 'none' || requesterRole === 'group_member' || requesterRole === 'group_moderator') {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }
            if (requesterRole === 'group_admin') {
                if (role === 'group_admin' || role === 'group_owner') return reply.status(403).send({ success: false, message: 'Admins cannot assign Admin or Owner roles' });
                if (targetRole === 'group_owner' || targetRole === 'group_admin') return reply.status(403).send({ success: false, message: 'Admins cannot modify Admins or Owners' });
            }
            if (requesterRole === 'group_owner') {
                if (targetRole === 'group_owner') return reply.status(403).send({ success: false, message: 'Cannot modify another Owner directly' });
            }

            const roleDef = await prisma.roles.findUnique({ where: { key: role } });
            if (!roleDef && role !== 'group_member') return reply.status(400).send({ success: false, message: 'Invalid role' });

            if (role === 'group_owner') {
                // Ownership transfer transaction
                const adminRoleDef = await prisma.roles.findUnique({ where: { key: 'group_admin' } });
                const groupRoleIds = (await prisma.roles.findMany({ where: { key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } } })).map((r: any) => r.id);
                
                await prisma.$transaction(async (tx: any) => {
                    // Update entity owner
                    await tx.entities.update({
                        where: { id: id },
                        data: { user_id: memberId }
                    });
                    
                    // Remove previous owner's group_owner roles and make them admin
                    await tx.role_assignments.deleteMany({
                        where: { user_id: request.user.id, scope_entity_id: id, role_id: { in: groupRoleIds } }
                    });
                    if (adminRoleDef) {
                        await tx.role_assignments.create({
                            data: {
                                tenant_id: request.user.tenantId,
                                user_id: request.user.id,
                                role_id: adminRoleDef.id,
                                scope_entity_id: id,
                                granted_by: request.user.id
                            }
                        });
                    }

                    // Remove target's existing roles and make them owner
                    await tx.role_assignments.deleteMany({
                        where: { user_id: memberId, scope_entity_id: id, role_id: { in: groupRoleIds } }
                    });
                    if (roleDef) {
                        await tx.role_assignments.create({
                            data: {
                                tenant_id: request.user.tenantId,
                                user_id: memberId,
                                role_id: roleDef.id,
                                scope_entity_id: id,
                                granted_by: request.user.id
                            }
                        });
                    }
                });
                
                return { success: true, message: 'Ownership transferred' };
            }

            const groupRoles = await prisma.roles.findMany({ where: { key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } } });
            const groupRoleIds = groupRoles.map((r: any) => r.id);

            await prisma.role_assignments.deleteMany({
                where: { user_id: memberId, scope_entity_id: id, role_id: { in: groupRoleIds } }
            });

            if (role !== 'group_member' && roleDef) {
                await prisma.role_assignments.create({
                    data: {
                        tenant_id: request.user.tenantId,
                        user_id: memberId,
                        role_id: roleDef.id,
                        scope_entity_id: id,
                        granted_by: request.user.id
                    }
                });
            }

            // Broadcast real-time update
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'role_update' });
            }

            return { success: true, message: 'Role updated successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/memberships/:memberId
    fastify.delete('/:id/memberships/:memberId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, memberId } = request.params as any;

            if (request.user.id === memberId) {
                return reply.status(403).send({ success: false, message: 'Cannot remove yourself' });
            }

            const requesterRole = await getHighestGroupRole(request.user.id, id);
            const targetRole = await getHighestGroupRole(memberId, id);

            if (requesterRole === 'none' || requesterRole === 'group_member' || requesterRole === 'group_moderator') {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }
            if (requesterRole === 'group_admin') {
                if (targetRole === 'group_owner' || targetRole === 'group_admin') return reply.status(403).send({ success: false, message: 'Admins cannot remove Admins or Owners' });
            }
            if (requesterRole === 'group_owner') {
                if (targetRole === 'group_owner') return reply.status(403).send({ success: false, message: 'Cannot remove another Owner' });
            }

            await prisma.role_assignments.deleteMany({
                where: { user_id: memberId, scope_entity_id: id }
            });

            await prisma.group_memberships.delete({
                where: { group_id_user_id: { group_id: id, user_id: memberId } }
            });
            
            // Broadcast real-time update
            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').to(`group_${id}`).emit('dashboard_updated', { action: 'remove_member' });
            }

            return { success: true, message: 'Member removed successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
    // PATCH /:id/visibility
    fastify.patch('/:id/visibility', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { visibility } = request.body as any; // public, private, hidden

            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const entity = await prisma.entities.update({
                where: { id },
                data: { visibility }
            });

            return { success: true, message: 'Visibility updated', data: entity.visibility };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/archive
    fastify.post('/:id/archive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;

            const group = await prisma.groups.findUnique({ where: { entity_id: id } });
            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            const ownerRole = await prisma.roles.findUnique({ where: { key: 'group_owner' } });
            const isOwner = ownerRole ? !!(await prisma.role_assignments.findFirst({
                where: { user_id: request.user.id, scope_entity_id: id, role_id: ownerRole.id }
            })) : false;
            if (!isOwner) return reply.status(403).send({ success: false, message: 'Only group owners can archive the group' });

            const currentSettings = (group.settings as any) || {};
            const updatedGroup = await prisma.groups.update({
                where: { entity_id: id },
                data: { settings: { ...currentSettings, isArchived: true, isDraft: false } },
                include: { entities: true }
            });

            if ((fastify as any).io) {
                (fastify as any).io.of('/groups').emit('groups_updated', { action: 'archive_group' });
            }

            return { success: true, data: toClientGroup(updatedGroup), message: 'Group archived' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/unarchive
    fastify.post('/:id/unarchive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;

            const group = await prisma.groups.findUnique({ where: { entity_id: id } });
            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            const ownerRole = await prisma.roles.findUnique({ where: { key: 'group_owner' } });
            const isOwner = ownerRole ? !!(await prisma.role_assignments.findFirst({
                where: { user_id: request.user.id, scope_entity_id: id, role_id: ownerRole.id }
            })) : false;
            if (!isOwner) return reply.status(403).send({ success: false, message: 'Only group owners can unarchive the group' });

            const currentSettings = (group.settings as any) || {};
            const { isArchived, ...rest } = currentSettings;
            const updatedGroup = await prisma.groups.update({
                where: { entity_id: id },
                data: { settings: rest },
                include: { entities: true }
            });

            return { success: true, data: toClientGroup(updatedGroup), message: 'Group unarchived' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/dashboard-stats
    fastify.get('/:id/dashboard-stats', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const totalPosts = await prisma.forum_posts.count({ where: { scope_type: 'group', scope_id: id } });
            const pinnedPosts = await prisma.forum_posts.count({ where: { scope_type: 'group', scope_id: id, pinned: true } });
            const lockedPosts = await prisma.forum_posts.count({ where: { scope_type: 'group', scope_id: id, locked: true } });
            
            const groupPosts = await prisma.forum_posts.findMany({ where: { scope_type: 'group', scope_id: id }, select: { id: true } });
            const groupPostIds = groupPosts.map(p => p.id);
            const reportedPosts = await prisma.moderation_reports.count({
                where: { target_type: 'forum_post', target_id: { in: groupPostIds }, state: 'open' }
            });

            const activeMembers = await prisma.group_memberships.count({ where: { group_id: id, state: 'active' } });
            const pendingMembers = await prisma.group_memberships.count({ where: { group_id: id, state: 'pending' } });

            return { success: true, data: { totalPosts, pinnedPosts, lockedPosts, reportedPosts, activeMembers, pendingMembers } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
    // GET /:id/posts
    fastify.get('/:id/posts', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const { page = 1, limit = 20, sort = 'new', tag, q } = request.query as any;

            const group = await prisma.groups.findUnique({ where: { entity_id: id }, include: { entities: true } });
            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            if (group.entities?.visibility === 'private') {
                if (!request.user) return reply.status(403).send({ success: false, message: 'Private group posts are hidden' });
                const membership = await getUserMembership(request.user.id, id);
                if (membership.state !== 'active' && !membership.isOwner) {
                    return reply.status(403).send({ success: false, message: 'Private group posts are hidden' });
                }
            }

            const userId = request.user?.id || null;
            const skip = (Number(page) - 1) * Number(limit);
            const lim = Number(limit);

            const allowedSorts: Record<string, string> = {
                new: 'fp.created_at DESC',
                hot: 'vote_score DESC, fp.created_at DESC',
                top: 'vote_score DESC',
                pinned: 'fp.pinned DESC, fp.created_at DESC',
            };
            const orderBy = allowedSorts[sort] || allowedSorts['new'];

            const params: any[] = [id];
            let whereExtra = '';
            if (sort === 'pinned') whereExtra += ' AND fp.pinned = true';
            if (q) {
                params.push(`%${q}%`);
                whereExtra += ` AND (fp.title ILIKE $${params.length} OR fp.body ILIKE $${params.length})`;
            }

            const posts: any[] = await prisma.$queryRawUnsafe(`
                SELECT
                    fp.id, fp.title, fp.body, fp.pinned, fp.locked, fp.solved, fp.archived,
                    fp.view_count, fp.status, fp.created_at, fp.updated_at, fp.deleted_at,
                    fp.author_user_id, fp.scope_type, fp.scope_id,
                    u.first_name, u.last_name, u.primary_email,
                    COALESCE(SUM(fv.vote), 0)::int AS vote_score,
                    (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = fp.id AND fv2.target_type = 'post' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote,
                    COUNT(DISTINCT fc.id)::int AS comments_count
                FROM forum_posts fp
                LEFT JOIN users u ON u.id = fp.author_user_id
                LEFT JOIN forum_votes fv ON fv.target_id = fp.id AND fv.target_type = 'post'
                LEFT JOIN forum_comments fc ON fc.post_id = fp.id AND fc.deleted_at IS NULL
                WHERE fp.scope_type = 'group' AND fp.scope_id = $1::uuid AND fp.deleted_at IS NULL${whereExtra}
                GROUP BY fp.id, u.first_name, u.last_name, u.primary_email
                ORDER BY ${orderBy}
                LIMIT $3 OFFSET $4
            `, id, userId, lim, skip);

            // Fetch reaction counts for returned posts
            const postIds = posts.map((p: any) => String(p.id));
            let reactionMap: Record<string, Record<string, number>> = {};
            let tagMap: Record<string, any[]> = {};
            if (postIds.length > 0) {
                const reactionRows: any[] = await prisma.$queryRawUnsafe(`
                    SELECT target_id, emoji, COUNT(*)::int AS cnt
                    FROM forum_reactions
                    WHERE target_id = ANY($1::uuid[]) AND target_type = 'post'
                    GROUP BY target_id, emoji
                `, postIds);
                reactionRows.forEach((r: any) => {
                    const pid = String(r.target_id);
                    if (!reactionMap[pid]) reactionMap[pid] = {};
                    reactionMap[pid][r.emoji] = Number(r.cnt);
                });

                const tagRows: any[] = await prisma.$queryRawUnsafe(`
                    SELECT fpt.post_id, ft.id AS tag_id, ft.name, ft.color
                    FROM forum_post_tags fpt
                    JOIN forum_tags ft ON ft.id = fpt.tag_id
                    WHERE fpt.post_id = ANY($1::uuid[])
                `, postIds);
                tagRows.forEach((r: any) => {
                    const pid = String(r.post_id);
                    if (!tagMap[pid]) tagMap[pid] = [];
                    tagMap[pid].push({ id: String(r.tag_id), name: r.name, color: r.color });
                });
            }

            // If tag filter requested, apply after fetching tags
            let filteredPosts = posts;
            if (tag) {
                filteredPosts = posts.filter((p: any) => {
                    const tags = tagMap[String(p.id)] || [];
                    return tags.some((t: any) => t.name === tag);
                });
            }

            const mappedPosts = filteredPosts.map((p: any) => {
                const username = p.primary_email ? p.primary_email.split('@')[0] : 'unknown';
                const name = (`${p.first_name || ''} ${p.last_name || ''}`).trim() || username || 'Unknown User';
                const pid = String(p.id);
                return {
                    id: pid, title: p.title, body: p.body, pinned: p.pinned, locked: p.locked,
                    solved: p.solved, archived: p.archived, view_count: Number(p.view_count),
                    status: p.status, created_at: p.created_at, updated_at: p.updated_at,
                    author_user_id: p.author_user_id, scope_type: p.scope_type, scope_id: p.scope_id,
                    author_name: name, author_username: username,
                    vote_score: Number(p.vote_score || 0),
                    user_vote: p.user_vote ? Number(p.user_vote) : 0,
                    comments_count: Number(p.comments_count || 0),
                    reactions: reactionMap[pid] || {},
                    tags: tagMap[pid] || []
                };
            });

            return { success: true, data: mappedPosts };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts
    fastify.post('/:id/posts', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { body, title, tags } = request.body as any;

            const group = await prisma.groups.findUnique({ where: { entity_id: id } });
            if (!group) return reply.status(404).send({ success: false, message: 'Group not found' });

            const settings = group.settings as any;
            const forumsEnabled = !settings?.forums || settings.forums.enabled !== false;
            if (!forumsEnabled) return reply.status(403).send({ success: false, message: 'Forums are disabled for this group' });

            const allowed = await checkForumPermission(request.user.id, id, 'create_thread', settings);
            if (!allowed) return reply.status(403).send({ success: false, message: 'You do not have permission to post in this group' });

            const post = await prisma.forum_posts.create({
                data: {
                    tenant_id: request.user.tenantId,
                    scope_type: 'group',
                    scope_id: id,
                    author_user_id: request.user.id,
                    title: title || null,
                    body: body,
                    status: 'active'
                }
            });

            // Handle tags
            if (Array.isArray(tags) && tags.length > 0) {
                for (const tagName of tags) {
                    const tagRows: any[] = await prisma.$queryRawUnsafe(
                        `INSERT INTO forum_tags(tenant_id, scope_id, scope_type, name, color)
                         VALUES ($1::uuid, $2::uuid, 'group', $3, $4)
                         ON CONFLICT (scope_id, name) DO UPDATE SET name=EXCLUDED.name
                         RETURNING id`,
                        request.user.tenantId, id, tagName, tagColorMap[tagName] || 'gray'
                    );
                    if (tagRows[0]) {
                        await prisma.$executeRawUnsafe(
                            `INSERT INTO forum_post_tags(post_id, tag_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING`,
                            post.id, String(tagRows[0].id)
                        );
                    }
                }
            }

            (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_thread', { groupId: id, postId: post.id });
            return reply.status(201).send({ success: true, data: { ...post, tags: tags || [], reactions: {}, vote_score: 0, user_vote: 0, comments_count: 0 }, message: 'Post created' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId
    fastify.patch('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { body } = request.body as any;

            const post = await prisma.forum_posts.findUnique({ where: { id: postId, scope_type: 'group', scope_id: id } });
            if (!post) return reply.status(404).send({ success: false, message: 'Post not found' });

            const isAdmin = await verifyGroupAdmin(request.user.id, id);
            if (!isAdmin && post.author_user_id !== request.user.id) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const updated = await prisma.forum_posts.update({ where: { id: postId }, data: { body } });
            return { success: true, data: updated, message: 'Post updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId — edit thread (5-minute window)
    fastify.patch('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { body, title } = request.body as any;

            const post = await prisma.forum_posts.findFirst({ where: { id: postId, scope_type: 'group', scope_id: id, deleted_at: null } });
            if (!post) return reply.status(404).send({ success: false, message: 'Post not found' });
            if (post.author_user_id !== request.user.id) return reply.status(403).send({ success: false, message: 'Only author can edit' });

            const createdAt = new Date(post.created_at);
            const now = new Date();
            const diffMs = now.getTime() - createdAt.getTime();
            if (diffMs > 5 * 60 * 1000) return reply.status(403).send({ success: false, message: 'Edit window expired (5 minutes)' });

            await prisma.$executeRawUnsafe(`UPDATE forum_posts SET body=$1, title=$2 WHERE id=$3::uuid`, body, title || null, postId);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_edited', { groupId: id, postId });
            return { success: true, message: 'Post updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/posts/:postId (soft delete)
    fastify.delete('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;

            const post = await prisma.forum_posts.findFirst({ where: { id: postId, scope_type: 'group', scope_id: id, deleted_at: null } });
            if (!post) return reply.status(404).send({ success: false, message: 'Post not found' });

            const isAdmin = await verifyGroupAdmin(request.user.id, id);
            if (!isAdmin && post.author_user_id !== request.user.id) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            await prisma.$executeRawUnsafe(`UPDATE forum_posts SET deleted_at = NOW() WHERE id = $1::uuid`, postId);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_deleted', { groupId: id, postId });
            return { success: true, message: 'Post deleted' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/posts/:postId — single thread with recursive comment tree
    fastify.get('/:id/posts/:postId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id, postId } = request.params as any;
            const userId = request.user?.id || null;

            const postRows: any[] = await prisma.$queryRawUnsafe(`
                SELECT fp.*, u.first_name, u.last_name, u.primary_email,
                    COALESCE(SUM(fv.vote), 0)::int AS vote_score,
                    (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = fp.id AND fv2.target_type = 'post' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote
                FROM forum_posts fp
                LEFT JOIN users u ON u.id = fp.author_user_id
                LEFT JOIN forum_votes fv ON fv.target_id = fp.id AND fv.target_type = 'post'
                WHERE fp.id = $1::uuid AND fp.scope_type = 'group' AND fp.scope_id = $3::uuid AND fp.deleted_at IS NULL
                GROUP BY fp.id, u.first_name, u.last_name, u.primary_email
            `, postId, userId, id);

            if (!postRows.length) return reply.status(404).send({ success: false, message: 'Thread not found' });
            const post = postRows[0];

            // Increment view_count
            await prisma.$executeRawUnsafe(`UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1::uuid`, postId);

            // Recursive CTE to fetch all comments with depth
            const commentRows: any[] = await prisma.$queryRawUnsafe(`
                WITH RECURSIVE comment_tree AS (
                    SELECT fc.id, fc.post_id, fc.parent_id, fc.author_user_id, fc.body, fc.status,
                           fc.deleted_at, fc.created_at, fc.updated_at, 0 AS depth
                    FROM forum_comments fc
                    WHERE fc.post_id = $1::uuid AND fc.parent_id IS NULL AND fc.deleted_at IS NULL
                    UNION ALL
                    SELECT fc.id, fc.post_id, fc.parent_id, fc.author_user_id, fc.body, fc.status,
                           fc.deleted_at, fc.created_at, fc.updated_at, ct.depth + 1
                    FROM forum_comments fc
                    JOIN comment_tree ct ON ct.id = fc.parent_id
                    WHERE fc.deleted_at IS NULL
                )
                SELECT ct.*,
                       u.first_name, u.last_name, u.primary_email,
                       COALESCE(SUM(fv.vote), 0)::int AS vote_score,
                       (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = ct.id AND fv2.target_type = 'comment' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote
                FROM comment_tree ct
                LEFT JOIN users u ON u.id = ct.author_user_id
                LEFT JOIN forum_votes fv ON fv.target_id = ct.id AND fv.target_type = 'comment'
                GROUP BY ct.id, ct.post_id, ct.parent_id, ct.author_user_id, ct.body, ct.status,
                         ct.deleted_at, ct.created_at, ct.updated_at, ct.depth,
                         u.first_name, u.last_name, u.primary_email
                ORDER BY ct.depth ASC, ct.created_at ASC
            `, postId, userId);

            const flatComments = commentRows.map((c: any) => {
                const username = c.primary_email ? c.primary_email.split('@')[0] : 'unknown';
                const name = (`${c.first_name || ''} ${c.last_name || ''}`).trim() || username || 'Unknown User';
                return {
                    id: String(c.id), post_id: String(c.post_id), parent_id: c.parent_id ? String(c.parent_id) : null,
                    author_user_id: String(c.author_user_id), body: c.body, status: c.status,
                    created_at: c.created_at, updated_at: c.updated_at, depth: Number(c.depth),
                    author_name: name, author_username: username,
                    vote_score: Number(c.vote_score || 0), user_vote: c.user_vote ? Number(c.user_vote) : 0,
                    replies: []
                };
            });

            const comments = buildCommentTree(flatComments);

            // Post reactions
            const reactionRows: any[] = await prisma.$queryRawUnsafe(`
                SELECT emoji, COUNT(*)::int AS cnt FROM forum_reactions
                WHERE target_id = $1::uuid AND target_type = 'post' GROUP BY emoji
            `, postId);
            const reactions: Record<string, number> = {};
            reactionRows.forEach((r: any) => { reactions[r.emoji] = Number(r.cnt); });

            // Post tags
            const tagRows: any[] = await prisma.$queryRawUnsafe(`
                SELECT ft.id, ft.name, ft.color FROM forum_post_tags fpt
                JOIN forum_tags ft ON ft.id = fpt.tag_id WHERE fpt.post_id = $1::uuid
            `, postId);
            const tags = tagRows.map((t: any) => ({ id: String(t.id), name: t.name, color: t.color }));

            const username = post.primary_email ? post.primary_email.split('@')[0] : 'unknown';
            const name = (`${post.first_name || ''} ${post.last_name || ''}`).trim() || username || 'Unknown User';

            return {
                success: true,
                data: {
                    id: String(post.id), title: post.title, body: post.body, pinned: post.pinned, locked: post.locked,
                    solved: post.solved, archived: post.archived, view_count: Number(post.view_count) + 1,
                    status: post.status, created_at: post.created_at, updated_at: post.updated_at,
                    author_user_id: String(post.author_user_id), scope_type: post.scope_type, scope_id: String(post.scope_id),
                    author_name: name, author_username: username,
                    vote_score: Number(post.vote_score || 0), user_vote: post.user_vote ? Number(post.user_vote) : 0,
                    reactions, tags, comments
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/comments — add a reply (supports parent_id for nesting)
    fastify.post('/:id/posts/:postId/comments', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { body, parent_id } = request.body as any;

            if (!body?.trim()) return reply.status(400).send({ success: false, message: 'Reply cannot be empty' });

            const post = await prisma.forum_posts.findFirst({ where: { id: postId, scope_type: 'group', scope_id: id, deleted_at: null } });
            if (!post) return reply.status(404).send({ success: false, message: 'Thread not found' });
            if (post.locked) return reply.status(403).send({ success: false, message: 'This thread is locked' });

            const group = await prisma.groups.findUnique({ where: { entity_id: id } });
            const settings = (group?.settings as any) || {};
            const forumsEnabled = !settings?.forums || settings.forums.enabled !== false;
            if (!forumsEnabled) return reply.status(403).send({ success: false, message: 'Forums are disabled' });

            const allowed = await checkForumPermission(request.user.id, id, 'reply_thread', settings);
            if (!allowed) return reply.status(403).send({ success: false, message: 'You do not have permission to reply in this group' });

            const data: any = { tenant_id: request.user.tenantId, post_id: postId, author_user_id: request.user.id, body, status: 'active' };
            if (parent_id) data.parent_id = parent_id;

            const comment = await prisma.forum_comments.create({
                data,
                include: { users: { select: { id: true, first_name: true, last_name: true, primary_email: true } } }
            });

            const u = (comment as any).users;
            const username = u?.primary_email ? u.primary_email.split('@')[0] : 'unknown';
            const name = u ? (`${u.first_name || ''} ${u.last_name || ''}`.trim() || username) : 'Unknown User';

            (fastify as any).io.of('/groups').to(`group_${id}`).emit('new_comment', { groupId: id, postId, commentId: comment.id });
            return reply.status(201).send({
                success: true,
                data: {
                    id: comment.id, post_id: comment.post_id, parent_id: (comment as any).parent_id || null,
                    author_user_id: comment.author_user_id, body: comment.body, status: comment.status,
                    created_at: comment.created_at, author_name: name, author_username: username,
                    vote_score: 0, user_vote: 0, replies: []
                },
                message: 'Reply added'
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/comments/:commentId — edit comment (5-minute window)
    fastify.patch('/:id/posts/:postId/comments/:commentId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId, commentId } = request.params as any;
            const { body } = request.body as any;

            const comment = await prisma.forum_comments.findFirst({ where: { id: commentId, post_id: postId, deleted_at: null } });
            if (!comment) return reply.status(404).send({ success: false, message: 'Comment not found' });
            if (comment.author_user_id !== request.user.id) return reply.status(403).send({ success: false, message: 'Only author can edit' });

            const createdAt = new Date(comment.created_at);
            const now = new Date();
            const diffMs = now.getTime() - createdAt.getTime();
            if (diffMs > 5 * 60 * 1000) return reply.status(403).send({ success: false, message: 'Edit window expired (5 minutes)' });

            await prisma.$executeRawUnsafe(`UPDATE forum_comments SET body=$1 WHERE id=$2::uuid`, body, commentId);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_edited', { groupId: id, postId, commentId });
            return { success: true, message: 'Comment updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/posts/:postId/comments/:commentId (soft delete)
    fastify.delete('/:id/posts/:postId/comments/:commentId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId, commentId } = request.params as any;

            const comment = await prisma.forum_comments.findFirst({ where: { id: commentId, post_id: postId, deleted_at: null } });
            if (!comment) return reply.status(404).send({ success: false, message: 'Comment not found' });

            const isAdmin = await verifyGroupAdmin(request.user.id, id);
            if (!isAdmin && comment.author_user_id !== request.user.id) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            await prisma.$executeRawUnsafe(`UPDATE forum_comments SET deleted_at = NOW() WHERE id = $1::uuid`, commentId);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_deleted', { groupId: id, postId, commentId });
            return { success: true, message: 'Comment deleted' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/vote — upvote/downvote/remove vote on thread
    fastify.post('/:id/posts/:postId/vote', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { postId } = request.params as any;
            const { vote } = request.body as any; // 1 | -1 | 0

            if (vote === 0) {
                await prisma.$executeRawUnsafe(
                    `DELETE FROM forum_votes WHERE user_id=$1::uuid AND target_id=$2::uuid AND target_type='post'`,
                    request.user.id, postId
                );
            } else {
                await prisma.$executeRawUnsafe(
                    `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
                     VALUES($1::uuid, $2::uuid, $3::uuid, 'post', $4)
                     ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
                    request.user.tenantId, request.user.id, postId, vote
                );
            }

            const rows: any[] = await prisma.$queryRawUnsafe(
                `SELECT COALESCE(SUM(vote),0)::int AS score FROM forum_votes WHERE target_id=$1::uuid AND target_type='post'`,
                postId
            );
            const { id } = request.params as any;
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_voted', { groupId: id, postId, score: Number(rows[0]?.score || 0) });
            return { success: true, data: { vote_score: Number(rows[0]?.score || 0), user_vote: vote === 0 ? 0 : vote } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/comments/:commentId/vote — vote on a comment
    fastify.post('/:id/posts/:postId/comments/:commentId/vote', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { commentId } = request.params as any;
            const { vote } = request.body as any;

            if (vote === 0) {
                await prisma.$executeRawUnsafe(
                    `DELETE FROM forum_votes WHERE user_id=$1::uuid AND target_id=$2::uuid AND target_type='comment'`,
                    request.user.id, commentId
                );
            } else {
                await prisma.$executeRawUnsafe(
                    `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
                     VALUES($1::uuid, $2::uuid, $3::uuid, 'comment', $4)
                     ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
                    request.user.tenantId, request.user.id, commentId, vote
                );
            }

            const rows: any[] = await prisma.$queryRawUnsafe(
                `SELECT COALESCE(SUM(vote),0)::int AS score FROM forum_votes WHERE target_id=$1::uuid AND target_type='comment'`,
                commentId
            );
            const { id, postId } = request.params as any;
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('comment_voted', { groupId: id, postId, commentId, score: Number(rows[0]?.score || 0) });
            return { success: true, data: { vote_score: Number(rows[0]?.score || 0), user_vote: vote === 0 ? 0 : vote } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/posts/:postId/react — toggle emoji reaction on a thread
    fastify.post('/:id/posts/:postId/react', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { postId } = request.params as any;
            const { emoji } = request.body as any;
            if (!emoji) return reply.status(400).send({ success: false, message: 'emoji required' });

            const existing: any[] = await prisma.$queryRawUnsafe(
                `SELECT id FROM forum_reactions WHERE user_id=$1::uuid AND target_id=$2::uuid AND target_type='post' AND emoji=$3`,
                request.user.id, postId, emoji
            );
            if (existing.length > 0) {
                await prisma.$executeRawUnsafe(`DELETE FROM forum_reactions WHERE id=$1::uuid`, String(existing[0].id));
            } else {
                await prisma.$executeRawUnsafe(
                    `INSERT INTO forum_reactions(tenant_id, user_id, target_id, target_type, emoji) VALUES($1::uuid,$2::uuid,$3::uuid,'post',$4)`,
                    request.user.tenantId, request.user.id, postId, emoji
                );
            }

            const rows: any[] = await prisma.$queryRawUnsafe(
                `SELECT emoji, COUNT(*)::int AS cnt FROM forum_reactions WHERE target_id=$1::uuid AND target_type='post' GROUP BY emoji`,
                postId
            );
            const reactions: Record<string, number> = {};
            rows.forEach((r: any) => { reactions[r.emoji] = Number(r.cnt); });
            const { id } = request.params as any;
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('thread_reacted', { groupId: id, postId, reactions });
            return { success: true, data: { reactions } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/solve — mark/unmark solved
    fastify.patch('/:id/posts/:postId/solve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { solved } = request.body as any;

            const post = await prisma.forum_posts.findFirst({ where: { id: postId, scope_type: 'group', scope_id: id } });
            if (!post) return reply.status(404).send({ success: false, message: 'Post not found' });

            const isAdmin = await verifyGroupAdmin(request.user.id, id);
            if (!isAdmin && post.author_user_id !== request.user.id) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            await prisma.forum_posts.update({ where: { id: postId }, data: { solved: !!solved } });
            return { success: true, message: solved ? 'Marked as solved' : 'Unmarked as solved' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/posts/:postId/archive — archive/unarchive
    fastify.patch('/:id/posts/:postId/archive', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, postId } = request.params as any;
            const { archived } = request.body as any;

            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            await prisma.forum_posts.update({ where: { id: postId }, data: { archived: !!archived } });
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

            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            await prisma.forum_posts.updateMany({ where: { id: postId, scope_type: 'group', scope_id: id }, data: { pinned } });
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

            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            await prisma.forum_posts.updateMany({ where: { id: postId, scope_type: 'group', scope_id: id }, data: { locked } });
            return { success: true, message: locked ? 'Post locked' : 'Post unlocked' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/tags — list tags for a group
    fastify.get('/:id/tags', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const rows: any[] = await prisma.$queryRawUnsafe(
                `SELECT id, name, color FROM forum_tags WHERE scope_id=$1::uuid AND scope_type='group' ORDER BY name`,
                id
            );
            return { success: true, data: rows.map(r => ({ id: String(r.id), name: r.name, color: r.color })) };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/tags — create a tag
    fastify.post('/:id/tags', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { name, color } = request.body as any;
            if (!(await verifyGroupAdmin(request.user.id, id))) return reply.status(403).send({ success: false, message: 'Forbidden' });
            const rows: any[] = await prisma.$queryRawUnsafe(
                `INSERT INTO forum_tags(tenant_id, scope_id, scope_type, name, color) VALUES($1::uuid,$2::uuid,'group',$3,$4) ON CONFLICT(scope_id,name) DO UPDATE SET color=EXCLUDED.color RETURNING id, name, color`,
                request.user.tenantId, id, name, color || 'gray'
            );
            return reply.status(201).send({ success: true, data: { id: String(rows[0].id), name: rows[0].name, color: rows[0].color } });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/tags/:tagId
    fastify.delete('/:id/tags/:tagId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, tagId } = request.params as any;
            if (!(await verifyGroupAdmin(request.user.id, id))) return reply.status(403).send({ success: false, message: 'Forbidden' });
            await prisma.$executeRawUnsafe(`DELETE FROM forum_tags WHERE id=$1::uuid AND scope_id=$2::uuid`, tagId, id);
            return { success: true, message: 'Tag deleted' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/forum-members — list selected-permission members
    fastify.get('/:id/forum-members', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            if (!(await verifyGroupAdmin(request.user.id, id))) return reply.status(403).send({ success: false, message: 'Forbidden' });
            const rows: any[] = await prisma.$queryRawUnsafe(
                `SELECT fmp.id, fmp.user_id, fmp.perm_type, u.first_name, u.last_name, u.primary_email
                 FROM forum_member_permissions fmp JOIN users u ON u.id = fmp.user_id
                 WHERE fmp.group_id=$1::uuid ORDER BY fmp.perm_type, u.primary_email`,
                id
            );
            return { success: true, data: rows.map(r => ({ id: String(r.id), user_id: String(r.user_id), perm_type: r.perm_type, name: (`${r.first_name||''} ${r.last_name||''}`).trim() || r.primary_email, email: r.primary_email })) };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/forum-members — grant selected permission
    fastify.post('/:id/forum-members', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { user_id, perm_type } = request.body as any;
            if (!(await verifyGroupAdmin(request.user.id, id))) return reply.status(403).send({ success: false, message: 'Forbidden' });
            await prisma.$executeRawUnsafe(
                `INSERT INTO forum_member_permissions(tenant_id, group_id, user_id, perm_type) VALUES($1::uuid,$2::uuid,$3::uuid,$4) ON CONFLICT DO NOTHING`,
                request.user.tenantId, id, user_id, perm_type
            );
            return reply.status(201).send({ success: true, message: 'Permission granted' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/forum-members/:userId/:permType
    fastify.delete('/:id/forum-members/:userId/:permType', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, userId, permType } = request.params as any;
            if (!(await verifyGroupAdmin(request.user.id, id))) return reply.status(403).send({ success: false, message: 'Forbidden' });
            await prisma.$executeRawUnsafe(
                `DELETE FROM forum_member_permissions WHERE group_id=$1::uuid AND user_id=$2::uuid AND perm_type=$3`,
                id, userId, permType
            );
            return { success: true, message: 'Permission revoked' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /:id/gallery
    fastify.get('/:id/gallery', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const isAdmin = await verifyGroupAdmin(request.user.id, id);
            const mem = await getUserMembership(request.user.id, id);
            const isMemberOrAdmin = isAdmin || mem.state === 'active';
            const statusFilter = isAdmin ? undefined : 'approved';

            const rows: any[] = await prisma.$queryRawUnsafe(`
                SELECT gg.id, gg.url, gg.type, gg.status, gg.created_at,
                       u.first_name, u.last_name
                FROM group_gallery gg
                LEFT JOIN users u ON u.id = gg.uploader_user_id
                WHERE gg.group_id = $1::uuid ${statusFilter ? "AND gg.status = 'approved'" : ""}
                ORDER BY gg.created_at DESC
            `, id);

            const data = rows.map(r => ({
                id: String(r.id),
                src: r.url,
                type: r.type,
                status: r.status,
                uploaderName: r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : 'Unknown',
                created_at: r.created_at
            }));
            return reply.send({ success: true, data });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/gallery — save uploaded media metadata
    fastify.post('/:id/gallery', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { url, type, needsApproval } = request.body as any;
            const userId = request.user.id;
            const tenantId = request.user.tenantId;
            const mem = await getUserMembership(userId, id);
            const isAdmin = await verifyGroupAdmin(userId, id);
            if (!isAdmin && mem.state !== 'active') return reply.status(403).send({ success: false, message: 'Members only' });

            const status = needsApproval && !isAdmin ? 'pending' : 'approved';
            const rows: any[] = await prisma.$queryRawUnsafe(`
                INSERT INTO group_gallery (tenant_id, group_id, uploader_user_id, url, type, status)
                VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6)
                RETURNING id, url, type, status, created_at
            `, tenantId, id, userId, url, type || 'image', status);

            (fastify as any).io.of('/groups').to(`group_${id}`).emit('gallery_updated', { groupId: id, action: 'upload', itemId: String(rows[0].id) });
            return reply.send({ success: true, data: { id: String(rows[0].id), src: rows[0].url, type: rows[0].type, status: rows[0].status } });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/gallery/:itemId/approve
    fastify.patch('/:id/gallery/:itemId/approve', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, itemId } = request.params as any;
            if (!(await verifyGroupAdmin(request.user.id, id))) return reply.status(403).send({ success: false, message: 'Admins only' });
            await prisma.$executeRawUnsafe(`UPDATE group_gallery SET status='approved' WHERE id=$1::uuid AND group_id=$2::uuid`, itemId, id);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('gallery_updated', { groupId: id, action: 'approve', itemId });
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
            const isAdmin = await verifyGroupAdmin(request.user.id, id);
            if (!isAdmin) {
                const rows: any[] = await prisma.$queryRawUnsafe(`SELECT uploader_user_id FROM group_gallery WHERE id=$1::uuid`, itemId);
                if (!rows.length || String(rows[0].uploader_user_id) !== request.user.id) {
                    return reply.status(403).send({ success: false, message: 'Forbidden' });
                }
            }
            await prisma.$executeRawUnsafe(`DELETE FROM group_gallery WHERE id=$1::uuid AND group_id=$2::uuid`, itemId, id);
            (fastify as any).io.of('/groups').to(`group_${id}`).emit('gallery_updated', { groupId: id, action: 'remove', itemId });
            return reply.send({ success: true });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PATCH /:id/settings
    fastify.patch('/:id/settings', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { settings } = request.body as any; 
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const group = await prisma.groups.update({
                where: { entity_id: id },
                data: { settings }
            });

            return { success: true, message: 'Settings updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
    // GET /:id/invites
    fastify.get('/:id/invites', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const invites = await prisma.group_invitations.findMany({
                where: { group_id: id },
                include: { users: { select: { id: true, primary_email: true, first_name: true, last_name: true } } },
                orderBy: { created_at: 'desc' }
            });

            return { success: true, data: invites };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /:id/invites
    fastify.post('/:id/invites', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id } = request.params as any;
            const { targets } = request.body as any; // Array of { email?: string, username?: string }
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const results = await InvitationService.createInvitations(id, request.user.id, targets || []);
            return { success: true, data: results };
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
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            const invite = await InvitationService.createShareableLink(id, request.user.id, { maxUses, expiryHours });
            return { success: true, data: invite };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /:id/invites/:inviteId
    fastify.delete('/:id/invites/:inviteId', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            const { id, inviteId } = request.params as any;
            
            if (!(await verifyGroupAdmin(request.user.id, id))) {
                return reply.status(403).send({ success: false, message: 'Forbidden' });
            }

            await prisma.group_invitations.update({
                where: { id: inviteId, group_id: id },
                data: { status: 'revoked' }
            });

            return { success: true, message: 'Invitation revoked' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // GET /invite/:token
    fastify.get('/invite/:token', async (request: any, reply) => {
        try {
            const { token } = request.params as any;
            
            // Extract token from Auth if present (not required)
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
                    group: toClientGroup(validation.invite?.groups)
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
            return { success: true, data: result, message };
        } catch (e: any) {
            return reply.status(400).send({ success: false, message: e.message });
        }
    });

};

export default groupRoutes;
