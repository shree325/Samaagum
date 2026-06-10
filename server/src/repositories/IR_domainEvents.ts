import { IBaseRepository } from './IBaseRepository';

export interface IDomainEvent {
  event_id?: string;
  tenant_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload?: any;
  occurred_at?: Date;
  published_at?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_domainEvents extends IBaseRepository<IDomainEvent> {
  findByEventType(eventType: string): Promise<IDomainEvent[]>;
  findByAggregateId(aggregateType: string, aggregateId: string): Promise<IDomainEvent[]>;
  findUnpublished(): Promise<IDomainEvent[]>;
}
