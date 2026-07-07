import { PrismaClient } from '@prisma/client';
import { IEvent, IR_events } from './IR_events';

export class R_events implements IR_events {
  constructor(private db: PrismaClient) {}

  async create(event: IEvent): Promise<IEvent> {
    const query = `
      INSERT INTO events (
        tenant_id, hosted_by_entity_id, parent_event_id, event_kind,
        title, description, status, starts_at, ends_at, venue_timezone,
        location_type, venue, online_link, capacity_total,
        registration_mode, approval_required, registration_form_id,
        cash_enabled, financial_locked_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *;
    `;
    const values = [
      event.tenant_id, event.hosted_by_entity_id, event.parent_event_id,
      event.event_kind ?? 'standalone', event.title, event.description,
      event.status ?? 'draft', event.starts_at, event.ends_at,
      event.venue_timezone, event.location_type ?? 'venue',
      event.venue ? JSON.stringify(event.venue) : null,
      event.online_link, event.capacity_total,
      event.registration_mode ?? 'paid', event.approval_required ?? false,
      event.registration_form_id, event.cash_enabled ?? false,
      event.financial_locked_at,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IEvent | null> {
    const result = await this.db.query('SELECT * FROM events WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getByHostEntity(entityId: string): Promise<IEvent[]> {
    const result = await this.db.query(
      'SELECT * FROM events WHERE hosted_by_entity_id = $1 ORDER BY starts_at DESC',
      [entityId]
    );
    return result.rows;
  }

  async getByStatus(tenantId: string, status: string): Promise<IEvent[]> {
    const result = await this.db.query(
      'SELECT * FROM events WHERE tenant_id = $1 AND status = $2 ORDER BY starts_at DESC',
      [tenantId, status]
    );
    return result.rows;
  }

  async getAll(tenantId: string): Promise<IEvent[]> {
    const result = await this.db.query(
      'SELECT * FROM events WHERE tenant_id = $1 ORDER BY starts_at DESC',
      [tenantId]
    );
    return result.rows;
  }

  async update(id: string, event: Partial<IEvent>): Promise<IEvent | null> {
    const result = await this.db.query(
      `UPDATE events SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        starts_at = COALESCE($4, starts_at),
        ends_at = COALESCE($5, ends_at),
        capacity_total = COALESCE($6, capacity_total),
        cash_enabled = COALESCE($7, cash_enabled),
        registration_mode = COALESCE($8, registration_mode),
        approval_required = COALESCE($9, approval_required),
        location_type = COALESCE($10, location_type),
        venue = COALESCE($11, venue),
        online_link = COALESCE($12, online_link)
      WHERE id = $13
      RETURNING *;`,
      [
        event.title, event.description, event.status,
        event.starts_at, event.ends_at, event.capacity_total,
        event.cash_enabled, event.registration_mode, event.approval_required,
        event.location_type,
        event.venue ? JSON.stringify(event.venue) : null,
        event.online_link, id,
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM events WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getHostedByEntityId(eventId: string): Promise<string | null> {
    const result = await this.db.query('SELECT hosted_by_entity_id FROM events WHERE id = $1::uuid LIMIT 1', [eventId]);
    return result.rows[0]?.hosted_by_entity_id || null;
  }
}