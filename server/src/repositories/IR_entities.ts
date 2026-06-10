import { IBaseRepository } from "./IBaseRepository";

export interface IEntity {
    entity_id?: string;
    tenant_id: string;
    parent_entity_id?: string | null;
    entity_type: 'org' | 'community' | 'sub_community' | 'group';
    name: string;
    status: 'active' | 'inactive' | 'archived';
    visibility: 'public' | 'private' | 'restricted';
    metadata?: any;
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_entities extends IBaseRepository<IEntity> {
    getChildren(parentEntityId: string): Promise<IEntity[]>;
    findByType(entityType: string): Promise<IEntity[]>;
    findByTenant(tenantId: string): Promise<IEntity[]>;
}