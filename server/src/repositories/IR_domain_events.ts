import { IBaseRepository } from './IBaseRepository';

export interface IDomainEvent {
  event_id?: string;
  tenant_id: string;

  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;

  occurred_at?: Date;
  published_at?: Date | null;

  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;

  created_at?: Date;
  updated_at?: Date;
}

export interface IR_domain_events extends IBaseRepository<IDomainEvent> {
  findByAggregate(aggregateType: string, aggregateId: string): Promise<IDomainEvent[]>;
  findByEventType(eventType: string): Promise<IDomainEvent[]>;
  findUnpublished(tenantId: string): Promise<IDomainEvent[]>;
}
