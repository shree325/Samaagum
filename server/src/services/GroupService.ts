// @ts-nocheck
import { R_groups } from '../repositories/R_groups';
import { R_group_memberships } from '../repositories/R_group_memberships';
import { R_entities } from '../repositories/R_entities';
import { R_roles } from '../repositories/R_roles';
import { R_roleAssignments } from '../repositories/R_roleAssignments';
import { R_users } from '../repositories/R_users';
import { R_forum_member_permissions } from '../repositories/R_forum_member_permissions';
import { R_forumPosts } from '../repositories/R_forumPosts';
import { R_forumComments } from '../repositories/R_forumComments';
import { R_group_gallery } from '../repositories/R_group_gallery';
import { R_forum_reactions } from '../repositories/R_forum_reactions';
import { R_forum_votes } from '../repositories/R_forum_votes';
import { R_forum_tags } from '../repositories/R_forum_tags';
import { R_forum_post_tags } from '../repositories/R_forum_post_tags';
import { InvitationService } from './InvitationService';
import prisma from '../config/prisma';
import { PlanEntitlementService } from './PlanEntitlementService';

export class GroupService {
    private static groupRepo = new R_groups();
    private static groupMembershipsRepo = new R_group_memberships();
    private static entitiesRepo = new R_entities(prisma);
    private static rolesRepo = new R_roles();
    private static roleAssignmentsRepo = new R_roleAssignments();
    private static usersRepo = new R_users(prisma);
    private static fmpRepo = new R_forum_member_permissions();
    private static forumPostsRepo = new R_forumPosts();
    private static forumCommentsRepo = new R_forumComments();
    private static groupGalleryRepo = new R_group_gallery();
    private static reactionsRepo = new R_forum_reactions();
    private static votesRepo = new R_forum_votes();
    private static tagsRepo = new R_forum_tags();
    private static postTagsRepo = new R_forum_post_tags();

    static toClientGroup(dbGroup: any) {
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
    }

    static parseDataUri(dataUri: string): { buffer: Buffer; mimeType: string } | null {
        const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return null;
        return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
    }

    static toUint8(buf: Buffer): Uint8Array {
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }

    static detectMime(data: Uint8Array | Buffer): string {
        const b = Buffer.from(data);
        if (b[0] === 0xFF && b[1] === 0xD8) return 'image/jpeg';
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
        if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x47) return 'image/webp';
        return 'image/jpeg';
    }

    static async getUserMembership(userId: string, groupId: string) {
        const [membership, entity, roleAssignments] = await Promise.all([
            this.groupMembershipsRepo.getByGroupAndUser(groupId, userId),
            prisma.entities.findUnique({ where: { id: groupId } }),
            this.roleAssignmentsRepo.findAll({ user_id: userId, scope_entity_id: groupId })
        ]);

        const isEntityCreator = entity?.user_id === userId;

        const rolesList = await this.rolesRepo.findAll();
        const roleKeys = (roleAssignments || []).map(ra => {
            const r = rolesList.find(role => role.id === ra.role_id);
            return r ? r.key : '';
        }).filter(Boolean);

        if (isEntityCreator && !roleKeys.includes('group_owner')) {
            roleKeys.unshift('group_owner');
        }

        return {
            state: membership?.state || null,
            roles: roleKeys,
            isOwner: isEntityCreator || roleKeys.includes('group_owner')
        };
    }

    static async userInGroups(userId: string, refs: string[]): Promise<boolean> {
        if (refs.length === 0) return false;
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const names: string[] = [];
        const ids: string[] = [];
        for (const ref of refs) {
            const tail = ref.slice(-36);
            if (uuidRe.test(tail)) {
                ids.push(tail);
            } else {
                names.push(ref);
            }
        }
        const orConditions: any[] = [];
        if (names.length > 0) orConditions.push({ entities: { groups: { name: { in: names } } } });
        if (ids.length > 0) orConditions.push({ group_id: { in: ids } });
        if (orConditions.length === 0) return false;
        const mem = await this.groupMembershipsRepo.findFirstActive(userId, orConditions);
        return !!mem;
    }

    static async userInCommunities(userId: string, refs: string[]): Promise<boolean> {
        if (refs.length === 0) return false;
        const cats = [...new Set(refs.flatMap(r => [r, r.startsWith('c-') ? r.slice(2) : null]).filter(Boolean) as string[])];
        const mem = await this.groupMembershipsRepo.findFirstActiveByCategory(userId, cats);
        return !!mem;
    }

    static async validateGroupEntitlements(userId: string, body: any, isUpdate = false, existingGroup?: any) {
        const ents = await PlanEntitlementService.getEntitlements(userId);
        const planKey = await PlanEntitlementService.getUserPlan(userId);
        const adminPlan = await prisma.admin_subscription_plans.findFirst({
            where: { name: planKey }
        });
        const planDisplayName = adminPlan?.display_name || (planKey.charAt(0).toUpperCase() + planKey.slice(1) + ' Plan');
        
        // 1. Check visibility / listed
        const listedVal = body.listed !== undefined ? body.listed : (existingGroup ? existingGroup.listed : 'unlisted');
        const visibilityVal = body.visibility !== undefined ? body.visibility : (existingGroup?.entities?.visibility || 'public');

        let requiredVisibility = 'unlisted';
        if (listedVal === 'listed' || visibilityVal === 'public') {
            requiredVisibility = 'public';
        } else if (visibilityVal === 'hidden' || visibilityVal === 'restricted') {
            requiredVisibility = 'restricted';
        }

        if (!ents.group_allowed_visibility.includes(requiredVisibility)) {
            throw new Error(`Your current plan (${planDisplayName}) does not allow creating ${requiredVisibility} groups. Please upgrade your plan.`);
        }
        
        // 2. Check restricted access in settings
        const settings = body.settings !== undefined ? body.settings : (existingGroup ? (existingGroup.settings || {}) : {});
        const hasRestrictedAccess = !!(settings?.restrictedAccess?.enabled || settings?.restrictedAccess?.visibility?.enabled || settings?.restrictedAccess?.join?.enabled);
        if (hasRestrictedAccess && !ents.group_can_restricted_access) {
            throw new Error(`Restricted access controls are locked for your current plan (${planDisplayName}). Please upgrade your plan to use them.`);
        }

        // 3. Check join mode
        const joinModeVal = body.joinMode !== undefined ? body.joinMode : (existingGroup ? existingGroup.join_mode : 'open');
        if (joinModeVal === 'restricted' || joinModeVal === 'restricted_access') {
            if (!ents.group_allowed_join_modes.includes('restricted_access')) {
                throw new Error(`Restricted join eligibility is locked for your current plan (${planDisplayName}). Please upgrade your plan to use it.`);
            }
        }

        // 4. Check group max capacity limit
        const capacity = settings?.capacity || {};
        if (ents.group_max_capacity !== -1) {
            if (capacity.limit === true && capacity.max > ents.group_max_capacity) {
                throw new Error(`Your plan limits group capacity to a maximum of ${ents.group_max_capacity} members.`);
            }
            if (capacity.limit !== true) {
                if (!body.settings) body.settings = {};
                if (!body.settings.capacity) body.settings.capacity = {};
                body.settings.capacity.limit = true;
                body.settings.capacity.max = ents.group_max_capacity;
            }
        }
    }

    static async createGroup(userId: string, tenantId: string, body: any) {
        await this.validateGroupEntitlements(userId, body);

        const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const bannerParsed = body.banner && body.banner.startsWith('data:') ? this.parseDataUri(body.banner) : null;
        const iconParsed = body.icon && body.icon.startsWith('data:') ? this.parseDataUri(body.icon) : null;

        const result = await this.groupRepo.createGroupTx({
            userId,
            tenantId,
            name: body.name,
            slug,
            description: body.description,
            category: body.category,
            icon: iconParsed ? null : (body.icon || null),
            icon_data: iconParsed ? this.toUint8(iconParsed.buffer) : null,
            cover: body.cover,
            banner: bannerParsed ? null : (body.banner || null),
            banner_data: bannerParsed ? this.toUint8(bannerParsed.buffer) : null,
            joinMode: body.joinMode,
            listed: body.listed,
            settings: body.settings,
            visibility: body.visibility
        });

        return this.toClientGroup(result);
    }

    static async getUserGroups(userId: string) {
        const memberships = await this.groupMembershipsRepo.getByUser(userId);
        const groupIds = memberships.map(m => m.group_id);

        const userGroups = await this.groupRepo.getGroupsWithEntities({ entity_id: { in: groupIds } });
        const groupMap = new Map(userGroups.map(g => [g.entity_id, g]));

        const groupRoles = await this.rolesRepo.findAll({ key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } });
        const groupRoleIds = groupRoles.map(r => r.id);
        const roles = await this.roleAssignmentsRepo.findAll({
            user_id: userId,
            role_id: { in: groupRoleIds }
        });

        const rolesByGroup = roles.reduce((acc: any, curr: any) => {
            const gid = curr.scope_entity_id;
            if (!gid) return acc;
            if (!acc[gid]) acc[gid] = [];
            const rDef = groupRoles.find(r => r.id === curr.role_id);
            if (rDef) acc[gid].push(rDef.key);
            return acc;
        }, {});

        const ownedGroups: any[] = [];
        const joinedGroups: any[] = [];
        const pendingGroups: any[] = [];
        const draftGroups: any[] = [];
        const archivedGroups: any[] = [];

        const membershipCounts = await this.groupMembershipsRepo.getMembershipCounts(groupIds);
        const countsMap = new Map(membershipCounts.map(m => [m.group_id, m._count._all]));

        for (const m of memberships) {
            const g = groupMap.get(m.group_id);
            if (!g) continue;
            const clientGroup = { ...this.toClientGroup(g), members: countsMap.get(g.entity_id) || 0 };
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

        return { ownedGroups, joinedGroups, pendingGroups, draftGroups, archivedGroups };
    }

    static async getMyManagedGroups(userId: string) {
        const adminRoles = ['group_owner', 'group_admin', 'group_moderator'];
        const rolesList = await this.rolesRepo.findAll({ key: { in: adminRoles } });
        const roleIds = rolesList.map(r => r.id);
        const roleAssignments = await this.roleAssignmentsRepo.findAll({
            user_id: userId,
            role_id: { in: roleIds }
        });

        const groupIds = [...new Set(roleAssignments.map(r => r.scope_entity_id).filter(Boolean))];
        if (groupIds.length === 0) return [];

        const groups = await this.groupRepo.getGroupsWithEntities({ entity_id: { in: groupIds } });
        return groups.map(g => ({
            id: g.entity_id,
            name: g.entities?.name || g.name,
            category: g.category
        }));
    }

    static async getGroupBanner(groupId: string) {
        const group = await this.groupRepo.findOne({ entity_id: groupId });
        if (!group) return null;
        return {
            banner_data: group.banner_data,
            banner: group.banner
        };
    }

    static async getGroupIcon(groupId: string) {
        const group = await this.groupRepo.findOne({ entity_id: groupId });
        if (!group) return null;
        return {
            icon_data: group.icon_data,
            icon: group.icon
        };
    }

    static async getGroupDetails(groupId: string, requestingUser?: any) {
        const group = await this.groupRepo.getGroupWithEntity(groupId);
        if (!group) return null;

        let membershipState = null;
        let isOwner = false;
        let forumPermissions: string[] = [];

        if (requestingUser) {
            const membership = await this.getUserMembership(requestingUser.id, groupId);
            membershipState = membership.state;
            isOwner = membership.isOwner;

            const perms = await this.fmpRepo.findAll({ group_id: groupId, user_id: requestingUser.id });
            forumPermissions = perms.map(p => p.perm_type);
        }

        if (group.entities?.visibility === 'private') {
            if (!requestingUser) throw new Error('This group is not publicly accessible');
            let allowed = isOwner || membershipState === 'active' || membershipState === 'pending';
            if (!allowed) {
                const settings: any = group.settings || {};
                const reqGroups: string[] = settings.restrictedAccess?.visibility?.groups || [];
                const reqCommunities: string[] = settings.restrictedAccess?.visibility?.communities || [];
                if (reqGroups.length > 0 || reqCommunities.length > 0) {
                    if (await this.userInGroups(requestingUser.id, reqGroups)) allowed = true;
                    if (!allowed && await this.userInCommunities(requestingUser.id, reqCommunities)) allowed = true;
                } else {
                    allowed = true;
                }
            }
            if (!allowed) throw new Error('You do not have access to view this group');
        }

        const activeMemberships = await this.groupMembershipsRepo.findAll({ group_id: groupId, state: 'active' });
        const userIds = activeMemberships.map(m => m.user_id);

        const activeUsers = await this.usersRepo.findAll({ id: { in: userIds } });
        const usersMap = new Map(activeUsers.map(u => [u.id, u]));

        const groupRoles = await this.roleAssignmentsRepo.findAll({ scope_entity_id: groupId });
        const rolesByUser = groupRoles.reduce((acc: any, curr: any) => {
            if (!acc[curr.user_id]) acc[curr.user_id] = [];
            acc[curr.user_id].push(curr.role_id);
            return acc;
        }, {});

        const ownerRole = (await this.rolesRepo.findAll({ key: 'group_owner' }))[0];
        const adminRole = (await this.rolesRepo.findAll({ key: 'group_admin' }))[0];
        const modRole = (await this.rolesRepo.findAll({ key: 'group_moderator' }))[0];

        const members = activeMemberships.map(m => {
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

        let isFull = false;
        let hasWaitlist = false;
        const capacity = (group.settings as any)?.capacity || {};
        if (capacity.limit === true && capacity.max > 0) {
            const ownerId = group.entities?.user_id;
            const activeCount = activeMemberships.filter(m => m.user_id !== ownerId).length;
            if (activeCount >= capacity.max) {
                isFull = true;
                if (capacity.waitlist === true) hasWaitlist = true;
            }
        }

        const clientGroup = this.toClientGroup(group);
        (clientGroup as any).isFull = isFull;
        (clientGroup as any).hasWaitlist = hasWaitlist;

        if (group.entities?.visibility === 'private' && membershipState !== 'active' && !isOwner) {
            return { group: clientGroup, membershipState, isOwner, members: [], forumPermissions };
        }
        return { group: clientGroup, membershipState, isOwner, members, forumPermissions };
    }

    static async updateGroup(groupId: string, userId: string, body: any) {
        const group = await this.groupRepo.getGroupWithEntity(groupId);
        if (!group) throw new Error('Group not found');

        const ownerRole = (await this.rolesRepo.findAll({ key: 'group_owner' }))[0];
        const isOwner = ownerRole ? !!(await this.roleAssignmentsRepo.findOne({
            user_id: userId,
            scope_entity_id: groupId,
            role_id: ownerRole.id
        })) : false;

        if (!isOwner) throw new Error('Only group owners can edit the group');

        await this.validateGroupEntitlements(userId, body, true, group);

        const bannerParsed = body.banner && body.banner.startsWith('data:') ? this.parseDataUri(body.banner) : null;
        const iconParsed = body.icon && body.icon.startsWith('data:') ? this.parseDataUri(body.icon) : null;

        const updatedGroup = await this.groupRepo.updateGroupTx(groupId, {
            name: body.name ?? group.name,
            description: body.description ?? group.description,
            category: body.category ?? group.category,
            icon: iconParsed ? null : (body.icon !== undefined ? body.icon : group.icon),
            icon_data: iconParsed ? this.toUint8(iconParsed.buffer) : undefined,
            cover: body.cover ?? group.cover,
            banner: bannerParsed ? null : (body.banner !== undefined ? body.banner : group.banner),
            banner_data: bannerParsed ? this.toUint8(bannerParsed.buffer) : undefined,
            join_mode: body.joinMode ?? group.join_mode,
            listed: body.listed ?? group.listed,
            settings: body.settings ?? group.settings,
            visibility: body.visibility
        });

        return this.toClientGroup(updatedGroup);
    }

    static async deleteGroup(groupId: string, userId: string) {
        const group = await this.groupRepo.findOne({ entity_id: groupId });
        if (!group) throw new Error('Group not found');

        const ownerRole = (await this.rolesRepo.findAll({ key: 'group_owner' }))[0];
        const isOwner = ownerRole ? !!(await this.roleAssignmentsRepo.findOne({
            user_id: userId,
            scope_entity_id: groupId,
            role_id: ownerRole.id
        })) : false;

        if (!isOwner) throw new Error('Only group owners can delete the group');

        await this.groupRepo.deleteGroupTx(groupId);
    }

    static async listGroups(userPayload?: any) {
        const groups = await this.groupRepo.getGroupsWithEntities({
            entities: { visibility: { in: ['public', 'private'] } }
        }, { entities: { created_at: 'desc' } });

        const membershipCounts = await this.groupMembershipsRepo.getMembershipCountsAll();
        const countsMap = new Map(membershipCounts.map(m => [m.group_id, m._count._all]));

        const publishedGroups: any[] = [];
        for (const g of groups) {
            const s = (g.settings as any) || {};
            if (s.isDraft || s.isArchived) continue;

            if (g.entities?.visibility === 'public') {
                publishedGroups.push(g);
                continue;
            }

            if (!userPayload) continue;

            const membership = await this.getUserMembership(userPayload.id, g.entity_id);
            if (membership.isOwner || membership.state === 'active' || membership.state === 'pending') {
                publishedGroups.push(g);
                continue;
            }

            const reqGroups: string[] = s.restrictedAccess?.visibility?.groups || [];
            const reqCommunities: string[] = s.restrictedAccess?.visibility?.communities || [];

            if (reqGroups.length > 0 || reqCommunities.length > 0) {
                let allowed = false;
                if (await this.userInGroups(userPayload.id, reqGroups)) allowed = true;
                if (!allowed && await this.userInCommunities(userPayload.id, reqCommunities)) allowed = true;
                if (allowed) publishedGroups.push(g);
            }
        }

        return publishedGroups.map(g => ({ ...this.toClientGroup(g), members: countsMap.get(g.entity_id) || 0 }));
    }

    private static toUnifiedGroup(g: any, memberCount: number, membershipState: string | null, isOwner: boolean) {
        const id = g.entity_id;
        const settings = (g.settings as any) || {};
        const iconUrl   = g.icon_data   ? `/api/groups/${id}/icon`   : (g.icon   && !g.icon.startsWith('blob:')   ? g.icon   : null);
        const bannerUrl = g.banner_data ? `/api/groups/${id}/banner` : (g.banner && !g.banner.startsWith('blob:') ? g.banner : null);
        return {
            id,
            type:            'group',
            name:            g.name,
            description:     g.description   ?? null,
            slug:            g.slug           ?? null,
            category:        g.category       ?? null,
            icon:            iconUrl,
            banner:          bannerUrl,
            visibility:      g.entities?.visibility ?? null,
            joinMode:        g.join_mode,
            listed:          g.listed,
            memberCount,
            isOwner,
            membershipState,
            isJoined:        membershipState === 'active',
            isPending:       membershipState === 'pending',
            isArchived:      !!settings.isArchived,
            isDraft:         !!settings.isDraft,
            createdAt:       g.entities?.created_at ?? null,
        };
    }

    static async getUnifiedGroups(userId: string | null, query: any) {
        const page  = Math.max(1, parseInt(query.page)  || 1);
        const limit = Math.min(100, parseInt(query.limit) || 20);
        const sort  = query.sort || 'newest';

        let groupIds: string[] | undefined = undefined;
        const membershipMap = new Map<string, string>();
        const ownedGroupIds = new Set<string>();

        const needsUserScope = userId && (
            query.myGroups === 'true' || query.myGroups === true ||
            query.owned    === 'true' || query.owned    === true ||
            query.joined   === 'true' || query.joined   === true ||
            query.pending  === 'true' || query.pending  === true
        );

        if (needsUserScope) {
            const memberships = await this.groupMembershipsRepo.getByUser(userId!);
            memberships.forEach((m: any) => membershipMap.set(m.group_id, m.state));

            const entities = await prisma.entities.findMany({
                where: { user_id: userId!, entity_type: 'group' },
                select: { id: true }
            });
            entities.forEach((e: any) => ownedGroupIds.add(e.id));

            let ids = [...membershipMap.keys()];

            if (query.owned === 'true' || query.owned === true) {
                ids = ids.filter(id => ownedGroupIds.has(id));
            } else if (query.joined === 'true' || query.joined === true) {
                ids = ids.filter(id => membershipMap.get(id) === 'active');
            } else if (query.pending === 'true' || query.pending === true) {
                ids = ids.filter(id => membershipMap.get(id) === 'pending');
            }

            groupIds = ids;
        }

        const { rows, total } = await this.groupRepo.getUnifiedGroups({
            page, limit, sort,
            search:     query.search     || undefined,
            category:   query.category   || undefined,
            visibility: query.visibility || 'public',
            joinMode:   query.joinMode   || undefined,
            groupIds,
        });

        const groupIdList = rows.map((g: any) => g.entity_id);
        const countRows = groupIdList.length > 0
            ? await this.groupMembershipsRepo.getMembershipCounts(groupIdList)
            : [];
        const countsMap = new Map(countRows.map((c: any) => [c.group_id, c._count._all]));

        let items = rows.map((g: any) => {
            const memberCount = countsMap.get(g.entity_id) || 0;
            const memState    = membershipMap.get(g.entity_id) ?? null;
            const isOwner     = ownedGroupIds.has(g.entity_id) ||
                                (userId ? g.entities?.user_id === userId : false);
            return this.toUnifiedGroup(g, memberCount, memState, isOwner);
        });

        if (sort === 'members_desc') {
            items.sort((a: any, b: any) => b.memberCount - a.memberCount);
        }

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        };
    }

    static async joinGroup(groupId: string, userId: string, tenantId: string, answers: any) {
        const group = await this.groupRepo.findOne({ entity_id: groupId });
        if (!group) throw new Error('Group not found');

        const existing = await this.groupMembershipsRepo.getByGroupAndUser(groupId, userId);
        if (existing) {
            if (existing.state === 'rejected') {
                await this.groupMembershipsRepo.deleteMembership(groupId, userId);
            } else {
                return { state: existing.state };
            }
        }

        if (group.join_mode === 'invite_only') {
            throw new Error('This group is invite only');
        }

        const settings = group.settings as any || {};
        const joinElig = settings.joinElig || 'anyone';
        if (joinElig === 'restricted' || joinElig === 'communities') {
            let allowed = false;
            const reqEnts = settings.restrictedAccess?.join?.selectedMembers || [];
            if (reqEnts.length > 0) {
                const entIds = reqEnts.map((e: any) => e.id).filter(Boolean);
                if (entIds.includes(userId)) allowed = true;
            }
            if (!allowed) {
                const reqGroups: string[] = settings.restrictedAccess?.join?.restricted?.groups || [];
                if (await this.userInGroups(userId, reqGroups)) allowed = true;
            }
            if (!allowed) {
                const reqCommunities: string[] = settings.restrictedAccess?.join?.restricted?.communities || [];
                if (await this.userInCommunities(userId, reqCommunities)) allowed = true;
            }
            if (!allowed) {
                throw new Error('You do not meet the requirements to join this group');
            }
        }

        const capacity = settings.capacity || {};
        let isWaitlisted = false;

        if (capacity.limit === true && capacity.max > 0) {
            // Exclude the group owner from the count so capacity applies only to regular members
            const groupEntity = await prisma.entities.findUnique({ where: { id: groupId }, select: { user_id: true } });
            const ownerUserId = groupEntity?.user_id;
            const activeCount = await prisma.group_memberships.count({
                where: {
                    group_id: groupId,
                    state: 'active',
                    ...(ownerUserId ? { user_id: { not: ownerUserId } } : {})
                }
            });

            if (activeCount >= capacity.max) {
                if (capacity.waitlist === true) {
                    isWaitlisted = true;
                } else {
                    throw new Error('Group is at full capacity');
                }
            }
        }

        const newState = isWaitlisted ? 'pending' : (group.join_mode === 'open' ? 'active' : 'pending');

        const membership = await this.groupMembershipsRepo.create({
            tenant_id: tenantId,
            group_id: groupId,
            user_id: userId,
            state: newState,
            answers: answers && Object.keys(answers).length > 0 ? answers : null,
            joined_at: newState === 'active' ? new Date() : null
        });

        return { state: newState };
    }

    static async getGroupMembers(groupId: string, state?: string, requestingUser?: any) {
        const group = await this.groupRepo.getGroupWithEntity(groupId);
        if (!group) throw new Error('Group not found');

        if (group.entities?.visibility === 'private') {
            if (!requestingUser) throw new Error('Private group members are hidden');
            const membership = await this.getUserMembership(requestingUser.id, groupId);
            if (membership.state !== 'active' && !membership.isOwner) {
                throw new Error('Private group members are hidden');
            }
        }

        let callerIsAdmin = false;
        if (requestingUser) {
            const callerMem = await this.getUserMembership(requestingUser.id, groupId);
            callerIsAdmin = callerMem.isOwner || ['group_admin', 'group_moderator'].includes(
                (callerMem.roles || []).find((r: string) => ['group_admin', 'group_moderator'].includes(r)) || ''
            );
        }

        const filter: any = { group_id: groupId };
        if (state) {
            if (state === 'pending' && !callerIsAdmin) {
                throw new Error('Only admins can view pending members');
            }
            filter.state = state;
        } else if (!callerIsAdmin) {
            filter.state = 'active';
        }

        const members = await this.groupMembershipsRepo.findAll(filter);
        const userIds = members.map(m => m.user_id);
        
        const activeUsers = await this.usersRepo.findAll({ id: { in: userIds } });
        const usersMap = new Map(activeUsers.map(u => [u.id, u]));

        const roleAssignments = await this.roleAssignmentsRepo.findAll({
            scope_entity_id: groupId,
            user_id: { in: userIds }
        });

        const rolesList = await this.rolesRepo.findAll();
        const rolesByUser = roleAssignments.reduce((acc: any, ra) => {
            if (!acc[ra.user_id]) acc[ra.user_id] = [];
            const rDef = rolesList.find(r => r.id === ra.role_id);
            if (rDef) acc[ra.user_id].push(rDef.key);
            return acc;
        }, {});

        return members.map(m => {
            const u = usersMap.get(m.user_id);
            const username = u?.primary_email ? u.primary_email.split('@')[0] : 'unknown';
            const displayName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : username;
            return {
                ...m,
                users: u ? { id: u.id, first_name: u.first_name, last_name: u.last_name, primary_email: u.primary_email, display_name: displayName || username, username } : null,
                roles: rolesByUser[m.user_id] || ['group_member']
            };
        });
    }

    static async getHighestGroupRole(userId: string, groupId: string): Promise<string> {
        const entity = await prisma.entities.findUnique({ where: { id: groupId } });
        if (entity?.user_id === userId) return 'group_owner';

        const assignments = await this.roleAssignmentsRepo.findAll({
            user_id: userId,
            scope_entity_id: groupId
        });

        const rolesList = await this.rolesRepo.findAll();
        const roles = assignments.map(a => {
            const r = rolesList.find(role => role.id === a.role_id);
            return r ? r.key : '';
        }).filter(Boolean);

        if (roles.includes('group_owner')) return 'group_owner';
        if (roles.includes('group_admin')) return 'group_admin';
        if (roles.includes('group_moderator')) return 'group_moderator';

        const membership = await this.groupMembershipsRepo.getByGroupAndUser(groupId, userId);
        if (membership?.state === 'active') return 'group_member';
        return 'none';
    }

    static async verifyGroupAdmin(userId: string, groupId: string) {
        const role = await this.getHighestGroupRole(userId, groupId);
        return ['group_owner', 'group_admin', 'group_moderator'].includes(role);
    }

    static async checkForumPermission(userId: string, groupId: string, permType: 'create_thread' | 'reply_thread', settings: any): Promise<boolean> {
        const perm = permType === 'create_thread'
            ? (settings?.forums?.threadPerm || 'everyone')
            : (settings?.forums?.replyPerm || 'everyone');
        const membership = await this.getUserMembership(userId, groupId);
        if (membership.isOwner) return true;
        if (membership.state !== 'active') return false;
        if (perm === 'everyone') return true;
        if (perm === 'members') return true;
        if (perm === 'admins') {
            const roles = membership.roles || [];
            return roles.some((r: string) => ['group_admin', 'group_moderator'].includes(r));
        }
        if (perm === 'selected') {
            const res = await this.fmpRepo.findAll({ group_id: groupId, user_id: userId, perm_type: permType });
            return res.length > 0;
        }
        return false;
    }

    static async approveMembership(groupId: string, memberId: string, adminUserId: string) {
        if (!(await this.verifyGroupAdmin(adminUserId, groupId))) {
            throw new Error('Forbidden');
        }

        const group = await this.groupRepo.findOne({ entity_id: groupId });
        const settings = (group?.settings as any) || {};
        const capacity = settings.capacity || {};

        if (capacity.limit === true && capacity.max > 0) {
            const groupEntity = await prisma.entities.findUnique({ where: { id: groupId }, select: { user_id: true } });
            const ownerUserId = groupEntity?.user_id;
            const activeCount = await prisma.group_memberships.count({
                where: {
                    group_id: groupId,
                    state: 'active',
                    ...(ownerUserId ? { user_id: { not: ownerUserId } } : {})
                }
            });

            if (activeCount >= capacity.max) {
                throw new Error('Cannot approve: Group is at full capacity');
            }
        }

        return await this.groupMembershipsRepo.update(
            (await this.groupMembershipsRepo.getByGroupAndUser(groupId, memberId))?.id!,
            { state: 'active', joined_at: new Date() }
        );
    }

    static async rejectMembership(groupId: string, memberId: string, adminUserId: string) {
        if (!(await this.verifyGroupAdmin(adminUserId, groupId))) {
            throw new Error('Forbidden');
        }
        return await this.groupMembershipsRepo.update(
            (await this.groupMembershipsRepo.getByGroupAndUser(groupId, memberId))?.id!,
            { state: 'rejected' }
        );
    }

    static async updateMemberRole(groupId: string, memberId: string, role: string, adminUser: any) {
        if (adminUser.id === memberId) {
            throw new Error('Cannot modify your own role');
        }

        const requesterRole = await this.getHighestGroupRole(adminUser.id, groupId);
        const targetRole = await this.getHighestGroupRole(memberId, groupId);

        if (requesterRole === 'none' || requesterRole === 'group_member' || requesterRole === 'group_moderator') {
            throw new Error('Forbidden');
        }
        if (requesterRole === 'group_admin') {
            if (role === 'group_admin' || role === 'group_owner') throw new Error('Admins cannot assign Admin or Owner roles');
            if (targetRole === 'group_owner' || targetRole === 'group_admin') throw new Error('Admins cannot modify Admins or Owners');
        }
        if (requesterRole === 'group_owner') {
            if (targetRole === 'group_owner') throw new Error('Cannot modify another Owner directly');
        }

        const roleDef = (await this.rolesRepo.findAll({ key: role }))[0];
        if (!roleDef && role !== 'group_member') throw new Error('Invalid role');

        if (role === 'group_owner') {
            const adminRoleDef = (await this.rolesRepo.findAll({ key: 'group_admin' }))[0];
            const groupRoles = await this.rolesRepo.findAll({ key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } });
            const groupRoleIds = groupRoles.map(r => r.id);

            await prisma.$transaction(async (tx: any) => {
                await tx.entities.update({
                    where: { id: groupId },
                    data: { user_id: memberId }
                });

                await tx.role_assignments.deleteMany({
                    where: { user_id: adminUser.id, scope_entity_id: groupId, role_id: { in: groupRoleIds } }
                });
                if (adminRoleDef) {
                    await tx.role_assignments.create({
                        data: {
                            tenant_id: adminUser.tenantId,
                            user_id: adminUser.id,
                            role_id: adminRoleDef.id,
                            scope_entity_id: groupId,
                            granted_by: adminUser.id
                        }
                    });
                }

                await tx.role_assignments.deleteMany({
                    where: { user_id: memberId, scope_entity_id: groupId, role_id: { in: groupRoleIds } }
                });
                if (roleDef) {
                    await tx.role_assignments.create({
                        data: {
                            tenant_id: adminUser.tenantId,
                            user_id: memberId,
                            role_id: roleDef.id,
                            scope_entity_id: groupId,
                            granted_by: adminUser.id
                        }
                    });
                }
            });

            return { message: 'Ownership transferred' };
        }

        const groupRoles = await this.rolesRepo.findAll({ key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } });
        const groupRoleIds = groupRoles.map(r => r.id);

        await this.roleAssignmentsRepo.dbModel.deleteMany({
            where: { user_id: memberId, scope_entity_id: groupId, role_id: { in: groupRoleIds } }
        });

        if (role !== 'group_member' && roleDef) {
            await this.roleAssignmentsRepo.create({
                tenant_id: adminUser.tenantId,
                user_id: memberId,
                role_id: roleDef.id,
                scope_entity_id: groupId,
                granted_by: adminUser.id
            });
        }

        return { message: 'Role updated successfully' };
    }

    static async removeMember(groupId: string, memberId: string, adminUser: any) {
        if (adminUser.id === memberId) {
            throw new Error('Cannot remove yourself');
        }

        const requesterRole = await this.getHighestGroupRole(adminUser.id, groupId);
        const targetRole = await this.getHighestGroupRole(memberId, groupId);

        if (requesterRole === 'none' || requesterRole === 'group_member' || requesterRole === 'group_moderator') {
            throw new Error('Forbidden');
        }
        if (requesterRole === 'group_admin') {
            if (targetRole === 'group_owner' || targetRole === 'group_admin') throw new Error('Admins cannot remove Admins or Owners');
        }
        if (requesterRole === 'group_owner') {
            if (targetRole === 'group_owner') throw new Error('Cannot remove another Owner');
        }

        const groupRoles = await this.rolesRepo.findAll({ key: { in: ['group_owner', 'group_admin', 'group_moderator', 'group_member'] } });
        const groupRoleIds = groupRoles.map(r => r.id);

        await this.roleAssignmentsRepo.dbModel.deleteMany({
            where: { user_id: memberId, scope_entity_id: groupId, role_id: { in: groupRoleIds } }
        });

        await this.groupMembershipsRepo.deleteMembership(groupId, memberId);
    }

    static async leaveGroup(groupId: string, userId: string) {
        const membership = await this.groupMembershipsRepo.getByGroupAndUser(groupId, userId);
        if (!membership) throw new Error('Not a member');

        const ownerRole = (await this.rolesRepo.findAll({ key: 'group_owner' }))[0];
        const roles = await this.roleAssignmentsRepo.findAll({
            user_id: userId,
            scope_entity_id: groupId,
            role_id: ownerRole.id
        });

        if (roles.length > 0) {
            const otherOwnersCount = await this.roleAssignmentsRepo.count({
                scope_entity_id: groupId,
                role_id: ownerRole.id,
                NOT: { user_id: userId }
            });
            if (otherOwnersCount === 0) {
                throw new Error('Owner cannot leave group without assigning another owner first');
            }
        }

        await this.groupMembershipsRepo.leaveGroupTx(groupId, userId);
    }

    static async updateVisibility(groupId: string, visibility: string, adminUserId: string) {
        if (!(await this.verifyGroupAdmin(adminUserId, groupId))) {
            throw new Error('Forbidden');
        }

        const ents = await PlanEntitlementService.getEntitlements(adminUserId);
        const planKey = await PlanEntitlementService.getUserPlan(adminUserId);
        const adminPlan = await prisma.admin_subscription_plans.findFirst({
            where: { name: planKey }
        });
        const planDisplayName = adminPlan?.display_name || (planKey.charAt(0).toUpperCase() + planKey.slice(1) + ' Plan');

        let requiredVisibility = 'unlisted';
        if (visibility === 'public') {
            requiredVisibility = 'public';
        } else if (visibility === 'hidden' || visibility === 'restricted') {
            requiredVisibility = 'restricted';
        }

        if (!ents.group_allowed_visibility.includes(requiredVisibility)) {
            throw new Error(`Your current plan (${planDisplayName}) does not allow setting group visibility to ${requiredVisibility}. Please upgrade your plan.`);
        }

        const entity = await this.entitiesRepo.update(groupId, { visibility: visibility as any });
        return entity?.visibility;
    }

    static async archiveGroup(groupId: string, userId: string) {
        const group = await this.groupRepo.findOne({ entity_id: groupId });
        if (!group) throw new Error('Group not found');

        const ownerRole = (await this.rolesRepo.findAll({ key: 'group_owner' }))[0];
        const isOwner = ownerRole ? !!(await this.roleAssignmentsRepo.findOne({
            user_id: userId,
            scope_entity_id: groupId,
            role_id: ownerRole.id
        })) : false;

        if (!isOwner) throw new Error('Only group owners can archive the group');

        const currentSettings = (group.settings as any) || {};
        const updatedGroup = await this.groupRepo.updateGroupTx(groupId, {
            settings: { ...currentSettings, isArchived: true, isDraft: false }
        });

        return this.toClientGroup(updatedGroup);
    }

    static async unarchiveGroup(groupId: string, userId: string) {
        const group = await this.groupRepo.findOne({ entity_id: groupId });
        if (!group) throw new Error('Group not found');

        const ownerRole = (await this.rolesRepo.findAll({ key: 'group_owner' }))[0];
        const isOwner = ownerRole ? !!(await this.roleAssignmentsRepo.findOne({
            user_id: userId,
            scope_entity_id: groupId,
            role_id: ownerRole.id
        })) : false;

        if (!isOwner) throw new Error('Only group owners can unarchive the group');

        const currentSettings = (group.settings as any) || {};
        const { isArchived, ...rest } = currentSettings;
        const updatedGroup = await this.groupRepo.updateGroupTx(groupId, {
            settings: rest
        });

        return this.toClientGroup(updatedGroup);
    }

    static async getDashboardStats(groupId: string, adminUserId: string) {
        if (!(await this.verifyGroupAdmin(adminUserId, groupId))) {
            throw new Error('Forbidden');
        }

        const totalPosts = await this.forumPostsRepo.count({ scope_type: 'group', scope_id: groupId });
        const pinnedPosts = await this.forumPostsRepo.count({ scope_type: 'group', scope_id: groupId, pinned: true });
        const lockedPosts = await this.forumPostsRepo.count({ scope_type: 'group', scope_id: groupId, locked: true });

        const groupPosts = await this.forumPostsRepo.findAll({ scope_type: 'group', scope_id: groupId });
        const groupPostIds = groupPosts.map(p => p.id!);
        const reportedPosts = await prisma.moderation_reports.count({
            where: { target_type: 'forum_post', target_id: { in: groupPostIds }, state: 'open' }
        });

        const activeMembers = await this.groupMembershipsRepo.count({ group_id: groupId, state: 'active' });
        const pendingMembers = await this.groupMembershipsRepo.count({ group_id: groupId, state: 'pending' });

        return { totalPosts, pinnedPosts, lockedPosts, reportedPosts, activeMembers, pendingMembers };
    }

    // Post / forum operations
    static async getGroupPosts(groupId: string, query: any, requestingUser?: any) {
        const { page = 1, limit = 20, sort = 'new', tag, q } = query;

        const group = await this.groupRepo.getGroupWithEntity(groupId);
        if (!group) throw new Error('Group not found');

        if (group.entities?.visibility === 'private') {
            if (!requestingUser) throw new Error('Private group posts are hidden');
            const membership = await this.getUserMembership(requestingUser.id, groupId);
            if (membership.state !== 'active' && !membership.isOwner) {
                throw new Error('Private group posts are hidden');
            }
        }

        const userId = requestingUser?.id || null;
        const skip = (Number(page) - 1) * Number(limit);
        const lim = Number(limit);

        const allowedSorts: Record<string, string> = {
            new: 'fp.created_at DESC',
            hot: 'vote_score DESC, fp.created_at DESC',
            top: 'vote_score DESC',
            pinned: 'fp.pinned DESC, fp.created_at DESC',
        };
        const orderBy = allowedSorts[sort] || allowedSorts['new'];

        const queryParams: any[] = [];
        let whereExtra = '';
        if (sort === 'pinned') whereExtra += ' AND fp.pinned = true';
        if (q) {
            queryParams.push(`%${q}%`);
            whereExtra += ` AND (fp.title ILIKE $5 OR fp.body ILIKE $5)`;
        }

        const posts = await this.forumPostsRepo.getGroupPostsRaw(groupId, userId, lim, skip, orderBy, whereExtra, queryParams);

        const postIds = posts.map((p: any) => String(p.id));
        const reactionMap: Record<string, Record<string, number>> = {};
        const tagMap: Record<string, any[]> = {};
        if (postIds.length > 0) {
            const reactionRows = await this.forumPostsRepo.getReactionCounts(postIds);
            reactionRows.forEach((r: any) => {
                const pid = String(r.target_id);
                if (!reactionMap[pid]) reactionMap[pid] = {};
                reactionMap[pid][r.emoji] = Number(r.cnt);
            });

            const tagRows = await this.forumPostsRepo.getTagRows(postIds);
            tagRows.forEach((r: any) => {
                const pid = String(r.post_id);
                if (!tagMap[pid]) tagMap[pid] = [];
                tagMap[pid].push({ id: String(r.tag_id), name: r.name, color: r.color });
            });
        }

        let filteredPosts = posts;
        if (tag) {
            filteredPosts = posts.filter((p: any) => {
                const tags = tagMap[String(p.id)] || [];
                return tags.some((t: any) => t.name === tag);
            });
        }

        return filteredPosts.map((p: any) => {
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
    }

    static async createGroupPost(groupId: string, user: any, body: any) {
        const group = await this.groupRepo.findOne({ entity_id: groupId });
        if (!group) throw new Error('Group not found');

        const settings = group.settings as any;
        const forumsEnabled = !settings?.forums || settings.forums.enabled !== false;
        if (!forumsEnabled) throw new Error('Forums are disabled for this group');

        const allowed = await this.checkForumPermission(user.id, groupId, 'create_thread', settings);
        if (!allowed) throw new Error('You do not have permission to post in this group');

        const post = await this.forumPostsRepo.create({
            tenant_id: user.tenantId,
            scope_type: 'group',
            scope_id: groupId,
            author_user_id: user.id,
            title: body.title || null,
            body: body.body,
            status: 'active'
        });

        const tagColorMap: Record<string, string> = {
            Question: 'blue', Announcement: 'orange', Help: 'purple', Bug: 'red',
            Feature: 'green', News: 'cyan', Discussion: 'gray', General: 'gray'
        };

        if (Array.isArray(body.tags) && body.tags.length > 0) {
            for (const tagName of body.tags) {
                const tagRows = await prisma.$queryRawUnsafe<any[]>(
                    `INSERT INTO forum_tags(tenant_id, scope_id, scope_type, name, color)
                     VALUES ($1::uuid, $2::uuid, 'group', $3, $4)
                     ON CONFLICT (scope_id, name) DO UPDATE SET name=EXCLUDED.name
                     RETURNING id`,
                    user.tenantId, groupId, tagName, tagColorMap[tagName] || 'gray'
                );
                if (tagRows[0]) {
                    await this.postTagsRepo.create({
                        post_id: post.id!,
                        tag_id: String(tagRows[0].id)
                    });
                }
            }
        }

        return { ...post, tags: body.tags || [], reactions: {}, vote_score: 0, user_vote: 0, comments_count: 0 };
    }

    static async editGroupPost(groupId: string, postId: string, user: any, body: any) {
        const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'group', scope_id: groupId, deleted_at: null } as any);
        if (!post) throw new Error('Post not found');
        if (post.author_user_id !== user.id) throw new Error('Only author can edit');

        const createdAt = new Date(post.created_at!);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        if (diffMs > 5 * 60 * 1000) throw new Error('Edit window expired (5 minutes)');

        await this.forumPostsRepo.updatePostRaw(postId, body.body, body.title);
    }

    static async deleteGroupPost(groupId: string, postId: string, user: any) {
        const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'group', scope_id: groupId, deleted_at: null } as any);
        if (!post) throw new Error('Post not found');

        const isAdmin = await this.verifyGroupAdmin(user.id, groupId);
        if (!isAdmin && post.author_user_id !== user.id) {
            throw new Error('Forbidden');
        }

        await this.forumPostsRepo.softDeletePost(postId);
    }

    static async getGroupPost(groupId: string, postId: string, requestingUser?: any) {
        const userId = requestingUser?.id || null;
        const post = await this.forumPostsRepo.getPostWithAuthorAndVotes(postId, userId, groupId);
        if (!post) return null;

        await this.forumPostsRepo.incrementViewCount(postId);

        const commentRows = await this.forumCommentsRepo.getRecursiveComments(postId, userId);

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

        const reactionRows = await this.forumPostsRepo.getPostReactions(postId);
        const reactions: Record<string, number> = {};
        reactionRows.forEach((r: any) => { reactions[r.emoji] = Number(r.cnt); });

        const tagRows = await this.forumPostsRepo.getPostTags(postId);
        const tags = tagRows.map((t: any) => ({ id: String(t.id), name: t.name, color: t.color }));

        const username = post.primary_email ? post.primary_email.split('@')[0] : 'unknown';
        const name = (`${post.first_name || ''} ${post.last_name || ''}`).trim() || username || 'Unknown User';

        return {
            id: String(post.id), title: post.title, body: post.body, pinned: post.pinned, locked: post.locked,
            solved: post.solved, archived: post.archived, view_count: Number(post.view_count) + 1,
            status: post.status, created_at: post.created_at, updated_at: post.updated_at,
            author_user_id: String(post.author_user_id), scope_type: post.scope_type, scope_id: String(post.scope_id),
            author_name: name, author_username: username,
            vote_score: Number(post.vote_score || 0), user_vote: post.user_vote ? Number(post.user_vote) : 0,
            reactions, tags, comments
        };
    }

    static async createGroupComment(groupId: string, postId: string, user: any, body: any) {
        const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'group', scope_id: groupId, deleted_at: null } as any);
        if (!post) throw new Error('Thread not found');
        if (post.locked) throw new Error('This thread is locked');

        const group = await this.groupRepo.findOne({ entity_id: groupId });
        const settings = (group?.settings as any) || {};
        const forumsEnabled = !settings?.forums || settings.forums.enabled !== false;
        if (!forumsEnabled) throw new Error('Forums are disabled');

        const allowed = await this.checkForumPermission(user.id, groupId, 'reply_thread', settings);
        if (!allowed) throw new Error('You do not have permission to reply in this group');

        const data: any = { tenant_id: user.tenantId, post_id: postId, author_user_id: user.id, body: body.body, status: 'active' };
        if (body.parent_id) data.parent_id = body.parent_id;

        const comment = await this.forumCommentsRepo.create(data);
        const commentUser = await this.usersRepo.findOne({ id: comment.author_user_id });
        
        const username = commentUser?.primary_email ? commentUser.primary_email.split('@')[0] : 'unknown';
        const name = commentUser ? (`${commentUser.first_name || ''} ${commentUser.last_name || ''}`.trim() || username) : 'Unknown User';

        return {
            id: comment.id, post_id: comment.post_id, parent_id: comment.parent_id || null,
            author_user_id: comment.author_user_id, body: comment.body, status: comment.status,
            created_at: comment.created_at, author_name: name, author_username: username,
            vote_score: 0, user_vote: 0, replies: []
        };
    }

    static async editGroupComment(groupId: string, postId: string, commentId: string, user: any, body: any) {
        const comment = await this.forumCommentsRepo.findOne({ id: commentId, post_id: postId, deleted_at: null } as any);
        if (!comment) throw new Error('Comment not found');
        if (comment.author_user_id !== user.id) throw new Error('Only author can edit');

        const createdAt = new Date(comment.created_at!);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        if (diffMs > 5 * 60 * 1000) throw new Error('Edit window expired (5 minutes)');

        await this.forumCommentsRepo.updateCommentRaw(commentId, body.body);
    }

    static async deleteGroupComment(groupId: string, postId: string, commentId: string, user: any) {
        const comment = await this.forumCommentsRepo.findOne({ id: commentId, post_id: postId, deleted_at: null } as any);
        if (!comment) throw new Error('Comment not found');

        const isAdmin = await this.verifyGroupAdmin(user.id, groupId);
        if (!isAdmin && comment.author_user_id !== user.id) {
            throw new Error('Forbidden');
        }

        await this.forumCommentsRepo.softDeleteComment(commentId);
    }

    static async voteGroupPost(groupId: string, postId: string, user: any, vote: number) {
        if (vote === 0) {
            await this.votesRepo.dbModel.deleteMany({
                where: { user_id: user.id, target_id: postId, target_type: 'post' }
            });
        } else {
            await prisma.$executeRawUnsafe(
                `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
                 VALUES($1::uuid, $2::uuid, $3::uuid, 'post', $4)
                 ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
                user.tenantId, user.id, postId, vote
            );
        }

        const scoreRows = await this.votesRepo.findAll({ target_id: postId, target_type: 'post' });
        const score = scoreRows.reduce((acc, curr) => acc + curr.vote, 0);
        return { vote_score: score, user_vote: vote };
    }

    static async voteGroupComment(groupId: string, commentId: string, user: any, vote: number) {
        if (vote === 0) {
            await this.votesRepo.dbModel.deleteMany({
                where: { user_id: user.id, target_id: commentId, target_type: 'comment' }
            });
        } else {
            await prisma.$executeRawUnsafe(
                `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
                 VALUES($1::uuid, $2::uuid, $3::uuid, 'comment', $4)
                 ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
                user.tenantId, user.id, commentId, vote
            );
        }

        const scoreRows = await this.votesRepo.findAll({ target_id: commentId, target_type: 'comment' });
        const score = scoreRows.reduce((acc, curr) => acc + curr.vote, 0);
        return { vote_score: score, user_vote: vote };
    }

    static async reactGroupPost(groupId: string, postId: string, user: any, emoji: string) {
        const existing = await this.reactionsRepo.findAll({ user_id: user.id, target_id: postId, target_type: 'post', emoji });
        if (existing.length > 0) {
            await this.reactionsRepo.delete(existing[0].id);
        } else {
            await this.reactionsRepo.create({
                tenant_id: user.tenantId,
                user_id: user.id,
                target_id: postId,
                target_type: 'post',
                emoji
            });
        }

        const rows = await this.reactionsRepo.findAll({ target_id: postId, target_type: 'post' });
        const reactions: Record<string, number> = {};
        rows.forEach(r => {
            reactions[r.emoji] = (reactions[r.emoji] || 0) + 1;
        });

        return reactions;
    }

    static async solveGroupPost(groupId: string, postId: string, user: any, solved: boolean) {
        const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'group', scope_id: groupId } as any);
        if (!post) throw new Error('Post not found');

        const isAdmin = await this.verifyGroupAdmin(user.id, groupId);
        if (!isAdmin && post.author_user_id !== user.id) {
            throw new Error('Forbidden');
        }

        await this.forumPostsRepo.updateSolveStatus(postId, solved);
    }

    static async archiveGroupPost(groupId: string, postId: string, user: any, archived: boolean) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) {
            throw new Error('Forbidden');
        }

        await this.forumPostsRepo.updateArchiveStatus(postId, archived);
    }

    static async pinGroupPost(groupId: string, postId: string, user: any, pinned: boolean) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) {
            throw new Error('Forbidden');
        }

        await this.forumPostsRepo.updatePinStatus(postId, pinned);
    }

    static async lockGroupPost(groupId: string, postId: string, user: any, locked: boolean) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) {
            throw new Error('Forbidden');
        }

        await this.forumPostsRepo.updateLockStatus(postId, locked);
    }

    static async listGroupTags(groupId: string) {
        const rows = await this.tagsRepo.findAll({ scope_id: groupId, scope_type: 'group' });
        return rows.map(r => ({ id: String(r.id), name: r.name, color: r.color }));
    }

    static async createGroupTag(groupId: string, user: any, name: string, color?: string) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');
        
        const existing = await this.tagsRepo.findOne({ scope_id: groupId, name });
        if (existing) {
            const updated = await this.tagsRepo.update(existing.id, { color: color || 'gray' });
            return { id: String(updated?.id), name: updated?.name, color: updated?.color };
        }

        const tag = await this.tagsRepo.create({
            tenant_id: user.tenantId,
            scope_id: groupId,
            scope_type: 'group',
            name,
            color: color || 'gray'
        });

        return { id: String(tag.id), name: tag.name, color: tag.color };
    }

    static async deleteGroupTag(groupId: string, tagId: string, user: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');
        await this.tagsRepo.dbModel.deleteMany({
            where: { id: tagId, scope_id: groupId }
        });
    }

    static async getForumMembers(groupId: string, user: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');
        
        const rows = await this.fmpRepo.findAll({ group_id: groupId });
        const userIds = rows.map(r => r.user_id);
        const users = await this.usersRepo.findAll({ id: { in: userIds } });
        
        return rows.map(r => {
            const u = users.find(userItem => userItem.id === r.user_id);
            const displayName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : (u?.primary_email || 'Unknown');
            return {
                id: String(r.id),
                user_id: String(r.user_id),
                perm_type: r.perm_type,
                name: displayName || u?.primary_email,
                email: u?.primary_email
            };
        });
    }

    static async addForumMemberPermission(groupId: string, user: any, body: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');
        
        const existing = await this.fmpRepo.findOne({ group_id: groupId, user_id: body.user_id, perm_type: body.perm_type });
        if (!existing) {
            await this.fmpRepo.create({
                tenant_id: user.tenantId,
                group_id: groupId,
                user_id: body.user_id,
                perm_type: body.perm_type
            });
        }
    }

    static async removeForumMemberPermission(groupId: string, userId: string, permType: string, user: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');
        
        await this.fmpRepo.dbModel.deleteMany({
            where: { group_id: groupId, user_id: userId, perm_type: permType }
        });
    }

    static async getGroupGallery(groupId: string, user: any, isAdmin: boolean) {
        const statusFilter = isAdmin ? undefined : 'approved';
        const filter: any = { group_id: groupId };
        if (statusFilter) filter.status = statusFilter;

        const rows = await this.groupGalleryRepo.findAll(filter);
        const userIds = rows.map(r => r.uploader_user_id);
        const users = await this.usersRepo.findAll({ id: { in: userIds } });

        return rows.map(r => {
            const u = users.find(userItem => userItem.id === r.uploader_user_id);
            const uploaderName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Unknown';
            return {
                id: String(r.id),
                src: r.url,
                type: r.type,
                status: r.status,
                uploaderName,
                created_at: r.created_at
            };
        });
    }

    static async uploadToGallery(groupId: string, user: any, body: any) {
        const mem = await this.getUserMembership(user.id, groupId);
        const isAdmin = await this.verifyGroupAdmin(user.id, groupId);
        if (!isAdmin && mem.state !== 'active') throw new Error('Members only');

        const group = await this.groupRepo.findOne({ entity_id: groupId });
        const settings = (group?.settings as any) || {};
        const gallerySettings = settings.gallery || {};

        if (!isAdmin && gallerySettings.allow === false) {
            throw new Error('Uploads are currently disabled for this group');
        }

        if (body.type === 'video' && gallerySettings.imageOnly) {
            throw new Error('Only images are allowed');
        }
        if (body.type === 'image' && gallerySettings.videoOnly) {
            throw new Error('Only videos are allowed');
        }

        const needsApproval = gallerySettings.approve || body.needsApproval;
        const status = needsApproval && !isAdmin ? 'pending' : 'approved';
        const row = await this.groupGalleryRepo.create({
            tenant_id: user.tenantId,
            group_id: groupId,
            uploader_user_id: user.id,
            url: body.url,
            type: body.type || 'image',
            status
        });

        return { id: String(row.id), src: row.url, type: row.type, status: row.status };
    }

    static async approveGalleryItem(groupId: string, itemId: string, user: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Admins only');
        await this.groupGalleryRepo.update(itemId, { status: 'approved' });
    }

    static async deleteGalleryItem(groupId: string, itemId: string, user: any) {
        const isAdmin = await this.verifyGroupAdmin(user.id, groupId);
        if (!isAdmin) {
            const row = await this.groupGalleryRepo.findOne({ id: itemId });
            if (!row || row.uploader_user_id !== user.id) {
                throw new Error('Forbidden');
            }
        }
        await this.groupGalleryRepo.delete(itemId);
    }

    static async updateSettings(groupId: string, settings: any, user: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');

        await this.groupRepo.update(groupId, { settings });
    }

    static async getGroupInvites(groupId: string, user: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');

        const invites = await prisma.group_invitations.findMany({
            where: { group_id: groupId },
            include: { users: { select: { id: true, primary_email: true, first_name: true, last_name: true } } },
            orderBy: { created_at: 'desc' }
        });
        return invites;
    }

    static async revokeGroupInvite(groupId: string, inviteId: string, user: any) {
        if (!(await this.verifyGroupAdmin(user.id, groupId))) throw new Error('Forbidden');

        await prisma.group_invitations.update({
            where: { id: inviteId, group_id: groupId },
            data: { status: 'revoked' }
        });
    }
}
