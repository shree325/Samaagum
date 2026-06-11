export interface IEvent {
  id?: string;
  tenant_id: string;
  hosted_by_entity_id: string;
  parent_event_id?: string | null;
  event_kind?: string;
  title: string;
  description?: string | null;
  status?: string;
  starts_at?: Date | null;
  ends_at?: Date | null;
  venue_timezone?: string | null;
  location_type?: string;
  venue?: Record<string, unknown> | null;
  online_link?: string | null;
  capacity_total?: number | null;
  registration_mode?: string;
  approval_required?: boolean;
  registration_form_id?: string | null;
  cash_enabled?: boolean;
  financial_locked_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_events {
  create(event: IEvent): Promise<IEvent>;
  getById(id: string): Promise<IEvent | null>;
  getByHostEntity(entityId: string): Promise<IEvent[]>;
  getByStatus(tenantId: string, status: string): Promise<IEvent[]>;
  getAll(tenantId: string): Promise<IEvent[]>;
  update(id: string, event: Partial<IEvent>): Promise<IEvent | null>;
  delete(id: string): Promise<boolean>;
}