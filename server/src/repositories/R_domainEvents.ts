import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IDomainEvent, IR_domainEvents } from './IR_domainEvents';
import pool from '../config/database';

export class R_domainEvents extends PostgresBaseRepository<IDomainEvent> implements IR_domainEvents {
  constructor() {
    super('domain_events', 'event_id');
  }

  async findByEventType(eventType: string): Promise<IDomainEvent[]> {
    const query = `SELECT * FROM domain_events WHERE event_type = $1`;
    const { rows } = await pool.query(query, [eventType]);
    return rows;
  }

  async findByAggregateId(aggregateType: string, aggregateId: string): Promise<IDomainEvent[]> {
    const query = `SELECT * FROM domain_events WHERE aggregate_type = $1 AND aggregate_id = $2`;
    const { rows } = await pool.query(query, [aggregateType, aggregateId]);
    return rows;
  }

  async findUnpublished(): Promise<IDomainEvent[]> {
    const query = `SELECT * FROM domain_events WHERE published_at IS NULL ORDER BY occurred_at ASC`;
    const { rows } = await pool.query(query);
    return rows;
  }
}
