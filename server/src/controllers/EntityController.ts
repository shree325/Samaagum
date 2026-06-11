import { Request, Response } from 'express';
import { EntityService } from '../services/EntityService';

const entityService = new EntityService();

export class EntityController {
    
    async createEntity(req: Request, res: Response) {
        try {
            const { tenant_id, parent_entity_id, entity_type, metadata } = req.body;

            let entity;
            if (entity_type === 'org') {
                entity = await entityService.createOrganization(tenant_id, metadata);
            } else if (entity_type === 'community') {
                entity = await entityService.createCommunity(tenant_id, parent_entity_id);
            } else if (entity_type === 'sub_community') {
                entity = await entityService.createSubCommunity(tenant_id, parent_entity_id);
            } else if (entity_type === 'group') {
                entity = await entityService.createGroup(tenant_id, parent_entity_id);
            } else {
                return res.status(400).json({ error: 'Invalid entity_type' });
            }

            res.status(201).json(entity);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getEntity(req: Request, res: Response) {
        try {
            const entity = await entityService.getEntity(req.params.id);
            if (!entity) return res.status(404).json({ error: 'Entity not found' });
            res.json(entity);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateEntity(req: Request, res: Response) {
        try {
            const entity = await entityService.updateEntity(req.params.id, req.body);
            if (!entity) return res.status(404).json({ error: 'Entity not found' });
            res.json(entity);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteEntity(req: Request, res: Response) {
        try {
            const success = await entityService.deleteEntity(req.params.id);
            if (!success) return res.status(404).json({ error: 'Entity not found' });
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
