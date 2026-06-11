import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IEvent, IR_events } from './IR_events';
import pool from '../config/database';

export class R_events extends PostgresBaseRepository<IEvent> implements IR_events {
  constructor() {
    super('events', 'event_id');
  }

  async findByHostedEntityId(entityId: string): Promise<IEvent[]> {
    const query = `SELECT * FROM events WHERE hosted_by_entity_id = $1 ORDER BY starts_at DESC`;
    const { rows } = await pool.query(query, [entityId]);
    return rows;
  }

  async findBySlug(tenantId: string, slug: string): Promise<IEvent | null> {
    const query = `SELECT * FROM events WHERE tenant_id = $1 AND slug = $2`;
    const { rows } = await pool.query(query, [tenantId, slug]);
    return rows[0] || null;
  }

  async findUpcoming(tenantId: string): Promise<IEvent[]> {
    const query = `SELECT * FROM events WHERE tenant_id = $1 AND starts_at >= NOW() AND status = 'published' ORDER BY starts_at ASC`;
    const { rows } = await pool.query(query, [tenantId]);
    return rows;
  }
}