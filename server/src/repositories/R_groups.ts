// @ts-nocheck
import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGroup, IR_groups, UnifiedGroupQuery, UnifiedGroupResult } from './IR_groups';

export class R_groups extends PostgresBaseRepository<IGroup> implements IR_groups {
    constructor() {
        super('groups', 'entity_id');
    }

    async findBySlug(slug: string): Promise<IGroup | null> {
        return (this.dbModel as any).findFirst({
            where: { slug }
        });
    }

    async getPublicGroups(): Promise<IGroup[]> {
        return (this.dbModel as any).findMany({
            where: { listed: 'listed' },
            include: { entities: { select: { visibility: true } } }
        });
    }

    async getPublicGroupsForHierarchy(): Promise<any[]> {
        return (this.dbModel as any).findMany({
            where: { entities: { visibility: 'public' } },
            include: { entities: { select: { visibility: true } } },
            orderBy: { name: 'asc' }
        });
    }

    async createGroupTx(data: {
        userId: string;
        tenantId: string;
        name: string;
        slug: string;
        description?: string | null;
        category?: string | null;
        icon?: string | null;
        icon_data?: Uint8Array | null;
        cover?: string | null;
        banner?: string | null;
        banner_data?: Uint8Array | null;
        joinMode?: 'open' | 'approval' | 'invite_only';
        listed?: 'listed' | 'unlisted';
        settings?: any;
        visibility?: string;
    }): Promise<any> {
        return await prisma.$transaction(async (tx) => {
            const rawVis = data.visibility || 'public';
            const entityVisibility = rawVis === 'hidden' ? 'private' : rawVis;
            const entity = await tx.entities.create({
                data: {
                    tenant_id: data.tenantId,
                    entity_type: 'group',
                    user_id: data.userId,
                    visibility: entityVisibility as any
                }
            });

            const group = await tx.groups.create({
                data: {
                    entity_id: entity.id,
                    name: data.name,
                    slug: data.slug,
                    description: data.description || null,
                    category: data.category || null,
                    icon: data.icon || null,
                    icon_data: data.icon_data ? Buffer.from(data.icon_data) : undefined,
                    cover: data.cover || null,
                    banner: data.banner || null,
                    banner_data: data.banner_data ? Buffer.from(data.banner_data) : undefined,
                    join_mode: data.joinMode || 'open',
                    listed: data.listed || 'unlisted',
                    settings: data.settings || {}
                }
            });

            await tx.group_memberships.create({
                data: {
                    tenant_id: data.tenantId,
                    group_id: entity.id,
                    user_id: data.userId,
                    state: 'active',
                    joined_at: new Date()
                }
            });

            const ownerRole = await tx.roles.findUnique({ where: { key: 'group_owner' } });
            if (ownerRole) {
                await tx.role_assignments.create({
                    data: {
                        tenant_id: data.tenantId,
                        user_id: data.userId,
                        role_id: ownerRole.id,
                        scope_entity_id: entity.id,
                        granted_by: data.userId
                    }
                });
            }

            return { ...group, entities: entity };
        });
    }

    async getGroupWithEntity(entityId: string): Promise<any> {
        return await prisma.groups.findUnique({
            where: { entity_id: entityId },
            include: { entities: true }
        });
    }

    async getGroupsWithEntities(filter?: any, orderBy?: any): Promise<any[]> {
        return await prisma.groups.findMany({
            where: filter || {},
            include: { entities: true },
            orderBy: orderBy || undefined
        });
    }

    async updateGroupTx(entityId: string, data: {
        name?: string;
        description?: string | null;
        category?: string | null;
        icon?: string | null;
        icon_data?: Uint8Array | null;
        cover?: string | null;
        banner?: string | null;
        banner_data?: Uint8Array | null;
        join_mode?: 'open' | 'approval' | 'invite_only';
        listed?: 'listed' | 'unlisted';
        settings?: any;
        visibility?: string;
    }): Promise<any> {
        return await prisma.groups.update({
            where: { entity_id: entityId },
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                icon: data.icon,
                icon_data: data.icon_data ? Buffer.from(data.icon_data) : undefined,
                cover: data.cover,
                banner: data.banner,
                banner_data: data.banner_data ? Buffer.from(data.banner_data) : undefined,
                join_mode: data.join_mode,
                listed: data.listed,
                settings: data.settings,
                entities: data.visibility ? {
                    update: { visibility: (data.visibility === 'hidden' ? 'private' : data.visibility) as any }
                } : undefined
            },
            include: { entities: true }
        });
    }

    async deleteGroupTx(entityId: string): Promise<void> {
        await prisma.$transaction([
            prisma.group_memberships.deleteMany({ where: { group_id: entityId } }),
            prisma.role_assignments.deleteMany({ where: { scope_entity_id: entityId } }),
            prisma.groups.delete({ where: { entity_id: entityId } }),
            prisma.entities.delete({ where: { id: entityId } })
        ]);
    }

    async getUnifiedGroups(params: UnifiedGroupQuery): Promise<UnifiedGroupResult> {
        const where: any = {};

        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } }
            ];
        }

        if (params.category) where.category = params.category;
        if (params.joinMode) where.join_mode = params.joinMode;

        if (params.visibility) {
            where.entities = { visibility: params.visibility };
        }

        if (params.groupIds !== undefined) {
            if (params.groupIds.length === 0) return { rows: [], total: 0 };
            where.entity_id = { in: params.groupIds };
        }

        const orderByMap: Record<string, any> = {
            newest:       { entities: { created_at: 'desc' } },
            oldest:       { entities: { created_at: 'asc' } },
            name_asc:     { name: 'asc' },
            name_desc:    { name: 'desc' },
            members_desc: { entities: { created_at: 'desc' } },
        };
        const orderBy = orderByMap[params.sort || 'newest'];

        const skip = ((params.page ?? 1) - 1) * (params.limit ?? 20);
        const take = params.limit ?? 20;

        const [rows, total] = await Promise.all([
            prisma.groups.findMany({ where, include: { entities: true }, orderBy, skip, take }),
            prisma.groups.count({ where })
        ]);

        return { rows, total };
    }
}
