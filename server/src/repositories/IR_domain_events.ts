export interface IDomainEvent {
  row_id?: string;
  bu_id: string;

  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at?: Date;

  created?: Date;
  created_by?: string | null;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_domain_events {
  create(event: IDomainEvent): Promise<IDomainEvent>;
  getById(rowId: string): Promise<IDomainEvent | null>;
  getByAggregate(aggregateType: string, aggregateId: string): Promise<IDomainEvent[]>;
  getAll(buId: string): Promise<IDomainEvent[]>;
  delete(rowId: string): Promise<boolean>;
}
