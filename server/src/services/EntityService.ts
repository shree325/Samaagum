import pool from '../config/database';
import { R_entities } from '../repositories/R_entities';
import { IEntity } from '../repositories/IR_entities';

export class EntityService {
    private entityRepo: R_entities;

    constructor() {
        this.entityRepo = new R_entities(pool);
    }

    async createOrganization(tenantId: string, metadata?: any): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            entity_type: 'org',
            status: 'active',
            visibility: 'public',
        });
    }

    async createCommunity(tenantId: string, parentEntityId: string): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            parent_entity_id: parentEntityId,
            entity_type: 'community',
            status: 'active',
            visibility: 'public',
        });
    }

    async createSubCommunity(tenantId: string, parentEntityId: string): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            parent_entity_id: parentEntityId,
            entity_type: 'sub_community',
            status: 'active',
            visibility: 'public',
        });
    }

    async createGroup(tenantId: string, parentEntityId: string): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            parent_entity_id: parentEntityId,
            entity_type: 'group',
            status: 'active',
            visibility: 'private',
        });
    }

    async getEntity(id: string): Promise<IEntity | null> {
        return this.entityRepo.getById(id);
    }

    async updateEntity(id: string, updates: Partial<IEntity>): Promise<IEntity | null> {
        return this.entityRepo.update(id, updates);
    }

    async deleteEntity(id: string): Promise<boolean> {
        return this.entityRepo.delete(id);
    }
}
