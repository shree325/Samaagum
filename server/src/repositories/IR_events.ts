export interface IEvent {
  id?: string;
  tenant_id: string;

  hosted_by_entity_id: string;
  parent_event_id?: string | null;
  event_category_id?: string | null;
  registration_form_id?: string | null;

  title: string;
  slug: string;
  event_kind?: string;
  short_description?: string | null;
  description?: string | null;

  starts_at: Date;
  ends_at: Date;
  venue_timezone?: string;

  location_type?: string;
  venue?: Record<string, unknown> | null;
  online_link?: string | null;

  banner_asset_id?: string | null;
  banner_url?: string | null;
  cover_asset_id?: string | null;

  visibility?: string;
  status?: string;

  capacity_total?: number | null;
  attendee_count?: number;
  registration_mode?: string;
  approval_required?: boolean;

  cash_enabled?: boolean;
  cash_payment_instructions?: string | null;

  financial_locked_at?: Date | null;
  published_at?: Date | null;
  registration_open_at?: Date | null;
  registration_close_at?: Date | null;

  x_data?: Record<string, unknown> | null;
  modification_num?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_events {
  create(event: IEvent): Promise<IEvent>;
  getById(id: string): Promise<IEvent | null>;
  getBySlug(tenantId: string, slug: string): Promise<IEvent | null>;
  getByHostEntity(entityId: string): Promise<IEvent[]>;
  getAll(): Promise<IEvent[]>;
  update(id: string, event: Partial<IEvent>): Promise<IEvent | null>;
  delete(id: string): Promise<boolean>;
}