import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IDomainEvent, IR_domain_events } from './IR_domain_events';
import pool from '../config/database';

export class R_domain_events extends PostgresBaseRepository<IDomainEvent> implements IR_domain_events {
  constructor() {
    super('domain_events', 'event_id');
  }

  async findByAggregate(aggregateType: string, aggregateId: string): Promise<IDomainEvent[]> {
    const { rows } = await pool.query(
      `SELECT * FROM domain_events WHERE aggregate_type = $1 AND aggregate_id = $2 ORDER BY occurred_at ASC`,
      [aggregateType, aggregateId]
    );
    return rows;
  }

  async findByEventType(eventType: string): Promise<IDomainEvent[]> {
    const { rows } = await pool.query(
      `SELECT * FROM domain_events WHERE event_type = $1 ORDER BY occurred_at DESC`,
      [eventType]
    );
    return rows;
  }

  async findUnpublished(tenantId: string): Promise<IDomainEvent[]> {
    const { rows } = await pool.query(
      `SELECT * FROM domain_events WHERE tenant_id = $1 AND published_at IS NULL ORDER BY occurred_at ASC`,
      [tenantId]
    );
    return rows;
  }
}
