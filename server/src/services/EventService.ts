import pool from '../config/database';
import { R_events } from '../repositories/R_events';
import { IEvent } from '../repositories/IR_events';

export class EventService {
  private eventRepo: R_events;

  constructor() {
    this.eventRepo = new R_events(pool);
  }

  async create(event: Partial<IEvent>): Promise<IEvent> {
    if (!event.tenant_id || !event.hosted_by_entity_id || !event.title) {
      throw new Error('tenant_id, hosted_by_entity_id, and title are required');
    }
    return this.eventRepo.create(event as IEvent);
  }

  async getById(id: string): Promise<IEvent | null> {
    return this.eventRepo.getById(id);
  }

  async getByHostEntity(entityId: string): Promise<IEvent[]> {
    return this.eventRepo.getByHostEntity(entityId);
  }

  async getPublished(tenantId: string): Promise<IEvent[]> {
    return this.eventRepo.getByStatus(tenantId, 'published');
  }

  async getAll(tenantId: string): Promise<IEvent[]> {
    return this.eventRepo.getAll(tenantId);
  }

  async update(id: string, updates: Partial<IEvent>): Promise<IEvent | null> {
    return this.eventRepo.update(id, updates);
  }

  async publish(id: string): Promise<IEvent | null> {
    return this.eventRepo.update(id, { status: 'published' });
  }

  async cancel(id: string): Promise<IEvent | null> {
    return this.eventRepo.update(id, { status: 'cancelled' });
  }

  async delete(id: string): Promise<boolean> {
    return this.eventRepo.delete(id);
  }
}
