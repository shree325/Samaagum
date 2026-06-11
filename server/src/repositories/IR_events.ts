import { IBaseRepository } from './IBaseRepository';

export interface IEvent {
  event_id?: string;
  tenant_id: string;

  hosted_by_entity_id: string;
  parent_event_id?: string | null;
  registration_form_id?: string | null;

  title: string;
  slug: string;
  event_kind?: string;
  short_description?: string | null;
  description?: string | null;

  starts_at: Date;
  ends_at: Date;
  venue_timezone?: string;

  location_type?: string | null;
  venue?: Record<string, unknown> | null;
  online_link?: string | null;

  cover_asset_id?: string | null;
  banner_asset_id?: string | null;

  visibility?: string;
  status?: string;

  capacity_total?: number | null;
  attendee_count?: number;
  registration_mode?: string;
  approval_required?: boolean;

  published_at?: Date | null;
  registration_open_at?: Date | null;
  registration_close_at?: Date | null;

  metadata?: Record<string, unknown>;
  cash_enabled?: boolean;
  financial_locked_at?: Date | null;
  modification_num?: number;

  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_events extends IBaseRepository<IEvent> {
  findByHostedEntityId(entityId: string): Promise<IEvent[]>;
  findBySlug(tenantId: string, slug: string): Promise<IEvent | null>;
  findUpcoming(tenantId: string): Promise<IEvent[]>;
}