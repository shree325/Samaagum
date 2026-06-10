import { Pool } from "pg";
import { IEvent, IR_events } from "./IR_events";

export class R_events implements IR_events {
  constructor(private db: Pool) {}

  async create(event: IEvent): Promise<IEvent> {
    const query = `
      INSERT INTO events (
        tenant_id, hosted_by_entity_id, parent_event_id, event_category_id,
        registration_form_id, title, slug, event_kind, short_description,
        description, starts_at, ends_at, venue_timezone, location_type,
        venue, online_link, banner_asset_id, banner_url, cover_asset_id,
        visibility, status, capacity_total, attendee_count, registration_mode,
        approval_required, cash_enabled, cash_payment_instructions,
        financial_locked_at, published_at, registration_open_at,
        registration_close_at, x_data, modification_num, created_by, updated_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35
      )
      RETURNING *;
    `;
    const values = [
      event.tenant_id, event.hosted_by_entity_id, event.parent_event_id,
      event.event_category_id, event.registration_form_id, event.title,
      event.slug, event.event_kind, event.short_description, event.description,
      event.starts_at, event.ends_at, event.venue_timezone, event.location_type,
      event.venue ? JSON.stringify(event.venue) : null, event.online_link,
      event.banner_asset_id, event.banner_url, event.cover_asset_id,
      event.visibility, event.status, event.capacity_total, event.attendee_count,
      event.registration_mode, event.approval_required, event.cash_enabled,
      event.cash_payment_instructions, event.financial_locked_at,
      event.published_at, event.registration_open_at, event.registration_close_at,
      event.x_data ? JSON.stringify(event.x_data) : null,
      event.modification_num ?? 0, event.created_by, event.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IEvent | null> {
    const result = await this.db.query(
      `SELECT * FROM events WHERE id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  async getBySlug(tenantId: string, slug: string): Promise<IEvent | null> {
    const result = await this.db.query(
      `SELECT * FROM events WHERE tenant_id = $1 AND slug = $2`,
      [tenantId, slug]
    );
    return result.rows[0] || null;
  }

  async getByHostEntity(entityId: string): Promise<IEvent[]> {
    const result = await this.db.query(
      `SELECT * FROM events WHERE hosted_by_entity_id = $1 ORDER BY starts_at DESC`,
      [entityId]
    );
    return result.rows;
  }

  async getAll(): Promise<IEvent[]> {
    const result = await this.db.query(
      `SELECT * FROM events ORDER BY starts_at DESC`
    );
    return result.rows;
  }

  async update(id: string, event: Partial<IEvent>): Promise<IEvent | null> {
    const result = await this.db.query(
      `
      UPDATE events
      SET
        title = COALESCE($1, title),
        short_description = COALESCE($2, short_description),
        description = COALESCE($3, description),
        status = COALESCE($4, status),
        visibility = COALESCE($5, visibility),
        capacity_total = COALESCE($6, capacity_total),
        attendee_count = COALESCE($7, attendee_count),
        cash_enabled = COALESCE($8, cash_enabled),
        registration_mode = COALESCE($9, registration_mode),
        updated_at = now(),
        updated_by = $10,
        modification_num = modification_num + 1
      WHERE id = $11
      RETURNING *;
      `,
      [
        event.title, event.short_description, event.description,
        event.status, event.visibility, event.capacity_total,
        event.attendee_count, event.cash_enabled, event.registration_mode,
        event.updated_by, id,
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM events WHERE id = $1`, [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}