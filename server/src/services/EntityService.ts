import { R_entities } from '../repositories/R_entities';
import { IEntity } from '../repositories/IR_entities';

export class EntityService {
    private entityRepo: R_entities;

    constructor() {
        this.entityRepo = new R_entities();
    }

    async createOrganization(tenantId: string, name: string, metadata?: any): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            entity_type: 'org',
            name,
            status: 'active',
            visibility: 'public',
            metadata: metadata || {}
        });
    }

    async createCommunity(tenantId: string, parentEntityId: string, name: string, metadata?: any): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            parent_entity_id: parentEntityId,
            entity_type: 'community',
            name,
            status: 'active',
            visibility: 'public',
            metadata: metadata || {}
        });
    }

    async createSubCommunity(tenantId: string, parentEntityId: string, name: string, metadata?: any): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            parent_entity_id: parentEntityId,
            entity_type: 'sub_community',
            name,
            status: 'active',
            visibility: 'public',
            metadata: metadata || {}
        });
    }

    async createGroup(tenantId: string, parentEntityId: string, name: string, metadata?: any): Promise<IEntity> {
        return this.entityRepo.create({
            tenant_id: tenantId,
            parent_entity_id: parentEntityId,
            entity_type: 'group',
            name,
            status: 'active',
            visibility: 'private',
            metadata: metadata || {}
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
