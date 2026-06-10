import { Pool } from "pg";
import { IBooking, IR_bookings } from "./IR_bookings";

export class R_bookings implements IR_bookings {
  constructor(private db: Pool) {}

  async create(b: IBooking): Promise<IBooking> {
    const query = `
      INSERT INTO bookings (
        tenant_id, event_id, booker_user_id, booking_reference,
        status, payment_method, hold_expires_at,
        subtotal_minor, discount_minor, tax_minor, total_minor, currency,
        total_tickets, source_channel, notes, x_data,
        modification_num, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *;
    `;
    const values = [
      b.tenant_id, b.event_id, b.booker_user_id, b.booking_reference,
      b.status, b.payment_method, b.hold_expires_at,
      b.subtotal_minor, b.discount_minor, b.tax_minor, b.total_minor, b.currency,
      b.total_tickets, b.source_channel, b.notes,
      b.x_data ? JSON.stringify(b.x_data) : null,
      b.modification_num ?? 0, b.created_by, b.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IBooking | null> {
    const result = await this.db.query(`SELECT * FROM bookings WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByReference(tenantId: string, ref: string): Promise<IBooking | null> {
    const result = await this.db.query(
      `SELECT * FROM bookings WHERE tenant_id = $1 AND booking_reference = $2`,
      [tenantId, ref]
    );
    return result.rows[0] || null;
  }

  async getByUserId(userId: string): Promise<IBooking[]> {
    const result = await this.db.query(
      `SELECT * FROM bookings WHERE booker_user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getByEventId(eventId: string): Promise<IBooking[]> {
    const result = await this.db.query(
      `SELECT * FROM bookings WHERE event_id = $1 ORDER BY created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  async getAll(): Promise<IBooking[]> {
    const result = await this.db.query(`SELECT * FROM bookings ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, b: Partial<IBooking>): Promise<IBooking | null> {
    const result = await this.db.query(
      `
      UPDATE bookings
      SET
        status = COALESCE($1, status),
        payment_method = COALESCE($2, payment_method),
        notes = COALESCE($3, notes),
        source_channel = COALESCE($4, source_channel),
        updated_at = now(),
        updated_by = $5,
        modification_num = modification_num + 1
      WHERE id = $6
      RETURNING *;
      `,
      [b.status, b.payment_method, b.notes, b.source_channel, b.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM bookings WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}