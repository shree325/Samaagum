import { IBaseRepository } from "./IBaseRepository";

export interface UnifiedGroupQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    visibility?: string;
    joinMode?: string;
    groupIds?: string[];
    sort?: string;
}

export interface UnifiedGroupResult {
    rows: any[];
    total: number;
}

export interface IGroup {
    entity_id: string;
    name: string;
    slug: string | null;
    description?: string | null;
    category?: string | null;
    icon?: string | null;
    cover?: string | null;
    banner?: string | null;
    join_mode: 'open' | 'approval' | 'invite_only';
    join_form_id?: string | null;
    listed: 'listed' | 'unlisted';
    icon_data?: Uint8Array | null;
    banner_data?: Uint8Array | null;
    settings?: any;
}

export interface IR_groups extends IBaseRepository<IGroup> {
    findBySlug(slug: string): Promise<IGroup | null>;
    getPublicGroups(): Promise<IGroup[]>;
    getPublicGroupsForHierarchy(): Promise<any[]>;
    createGroupTx(data: {
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
    }): Promise<any>;
    getGroupWithEntity(entityId: string): Promise<any>;
    getGroupsWithEntities(filter?: any, orderBy?: any): Promise<any[]>;
    getUnifiedGroups(params: UnifiedGroupQuery): Promise<UnifiedGroupResult>;
    updateGroupTx(entityId: string, data: {
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
    }): Promise<any>;
    deleteGroupTx(entityId: string): Promise<void>;
}
