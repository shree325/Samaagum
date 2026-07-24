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
        cash_enabled, financial_locked_at, instruction,
        registration_status, registration_opens_at, registration_closes_at, settings,
        payment_instructions, payment_hold_hours
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
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
      event.financial_locked_at, event.instruction,
      event.registration_status ?? 'OPEN', event.registration_opens_at ?? null, event.registration_closes_at ?? null,
      event.settings ? JSON.stringify(event.settings) : null,
      event.payment_instructions ?? null,
      event.payment_hold_hours ?? 48
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

  async getByStatusFiltered(tenantId: string, status: string, radiusFilter?: number, lat?: number, lon?: number, refCityName?: string): Promise<(IEvent & { _distance?: number })[]> {
    if (radiusFilter !== undefined && lat !== undefined && lon !== undefined) {
      const { getHaversineSQL } = await import('../utils/geo');
      const distSql = getHaversineSQL("COALESCE(e.venue->>'lat', e.venue->'meta'->>'lat')", "COALESCE(e.venue->>'lon', e.venue->'meta'->>'lon')");
      
      const query = `
        SELECT e.*,
               ${distSql} AS _distance
        FROM events e
        WHERE e.tenant_id = $1 AND e.status = $2
          AND (
            e.location_type = 'online' OR
            (
              COALESCE(e.venue->>'lat', e.venue->'meta'->>'lat') IS NOT NULL AND
              ${distSql} <= $5
            )
          )
        ORDER BY _distance ASC NULLS LAST, starts_at DESC
      `;
      const result = await (this.db as any).query(query, [tenantId, status, lat, lon, radiusFilter]);
      return result.rows;
    } else {
      const result = await (this.db as any).query(
        'SELECT * FROM events WHERE tenant_id = $1 AND status = $2 ORDER BY starts_at DESC',
        [tenantId, status]
      );
      return result.rows;
    }
  }

  async getAll(tenantId: string): Promise<IEvent[]> {
    const result = await this.db.query(
      'SELECT * FROM events WHERE tenant_id = $1 ORDER BY starts_at DESC',
      [tenantId]
    );
    return result.rows;
  }

  async update(id: string, event: Partial<IEvent>): Promise<IEvent | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const addField = (key: keyof IEvent, dbCol: string, transform?: (v: any) => any) => {
      if (event[key] !== undefined) {
        fields.push(`${dbCol} = $${idx++}`);
        const val = event[key];
        values.push(transform && val !== null ? transform(val) : val);
      }
    };

    addField('title', 'title');
    addField('description', 'description');
    addField('status', 'status');
    addField('starts_at', 'starts_at');
    addField('ends_at', 'ends_at');
    addField('capacity_total', 'capacity_total');
    addField('cash_enabled', 'cash_enabled');
    addField('registration_mode', 'registration_mode');
    addField('approval_required', 'approval_required');
    addField('location_type', 'location_type');
    addField('venue', 'venue', v => JSON.stringify(v));
    addField('online_link', 'online_link');
    addField('instruction', 'instruction');
    addField('hosted_by_entity_id', 'hosted_by_entity_id');
    addField('registration_status', 'registration_status');
    addField('registration_opens_at', 'registration_opens_at');
    addField('registration_closes_at', 'registration_closes_at');
    addField('settings', 'settings', v => JSON.stringify(v));
    addField('payment_instructions', 'payment_instructions');
    addField('payment_hold_hours', 'payment_hold_hours');

    if (fields.length === 0) {
      const current = await this.db.query('SELECT * FROM events WHERE id = $1', [id]);
      return current.rows[0] || null;
    }

    values.push(id);
    const result = await this.db.query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async updateRegistrationStatus(id: string, status: 'OPEN'|'CLOSED'|'SCHEDULED', opensAt?: Date | null, closesAt?: Date | null): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE events SET 
        registration_status = $1, 
        registration_opens_at = $2, 
        registration_closes_at = $3 
      WHERE id = $4`,
      [status, opensAt || null, closesAt || null, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM events WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}