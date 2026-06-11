import { PrismaClient } from '@prisma/client';
import { IBooking, IR_bookings } from './IR_bookings';

export class R_bookings implements IR_bookings {
  constructor(private db: PrismaClient) {}

  async create(booking: IBooking): Promise<IBooking> {
    const query = `
      INSERT INTO bookings (
        tenant_id, event_id, booker_user_id, status, payment_method,
        hold_expires_at, total_amount_minor, total_currency
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;
    const values = [
      booking.tenant_id, booking.event_id, booking.booker_user_id,
      booking.status ?? 'pending_payment', booking.payment_method ?? 'free',
      booking.hold_expires_at, booking.total_amount_minor, booking.total_currency,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IBooking | null> {
    const result = await this.db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getByUserId(userId: string): Promise<IBooking[]> {
    const result = await this.db.query(
      'SELECT * FROM bookings WHERE booker_user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async getByEventId(eventId: string): Promise<IBooking[]> {
    const result = await this.db.query(
      'SELECT * FROM bookings WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );
    return result.rows;
  }

  async getByStatus(eventId: string, status: string): Promise<IBooking[]> {
    const result = await this.db.query(
      'SELECT * FROM bookings WHERE event_id = $1 AND status = $2',
      [eventId, status]
    );
    return result.rows;
  }

  async update(id: string, booking: Partial<IBooking>): Promise<IBooking | null> {
    const result = await this.db.query(
      `UPDATE bookings SET
        status = COALESCE($1, status),
        payment_method = COALESCE($2, payment_method),
        hold_expires_at = COALESCE($3, hold_expires_at),
        total_amount_minor = COALESCE($4, total_amount_minor),
        total_currency = COALESCE($5, total_currency)
      WHERE id = $6
      RETURNING *;`,
      [
        booking.status, booking.payment_method, booking.hold_expires_at,
        booking.total_amount_minor, booking.total_currency, id,
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM bookings WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}