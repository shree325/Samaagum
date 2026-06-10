import { Pool } from "pg";
import { IBookingLineItem, IR_booking_line_items } from "./IR_booking_line_items";

export class R_booking_line_items implements IR_booking_line_items {
  constructor(private db: Pool) {}

  async create(item: IBookingLineItem): Promise<IBookingLineItem> {
    const query = `
      INSERT INTO booking_line_items (
        tenant_id, booking_id, ticket_type_id, quantity,
        unit_price_minor, currency, discount_minor, tax_minor, total_minor,
        line_status, attendee_capture_mode, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *;
    `;
    const values = [
      item.tenant_id, item.booking_id, item.ticket_type_id, item.quantity,
      item.unit_price_minor, item.currency, item.discount_minor,
      item.tax_minor, item.total_minor, item.line_status,
      item.attendee_capture_mode, item.created_by, item.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IBookingLineItem | null> {
    const result = await this.db.query(
      `SELECT * FROM booking_line_items WHERE id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  async getByBookingId(bookingId: string): Promise<IBookingLineItem[]> {
    const result = await this.db.query(
      `SELECT * FROM booking_line_items WHERE booking_id = $1`,
      [bookingId]
    );
    return result.rows;
  }

  async getAll(): Promise<IBookingLineItem[]> {
    const result = await this.db.query(
      `SELECT * FROM booking_line_items ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async update(id: string, item: Partial<IBookingLineItem>): Promise<IBookingLineItem | null> {
    const result = await this.db.query(
      `
      UPDATE booking_line_items
      SET
        line_status = COALESCE($1, line_status),
        discount_minor = COALESCE($2, discount_minor),
        tax_minor = COALESCE($3, tax_minor),
        total_minor = COALESCE($4, total_minor),
        updated_at = now(),
        updated_by = $5
      WHERE id = $6
      RETURNING *;
      `,
      [item.line_status, item.discount_minor, item.tax_minor, item.total_minor, item.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM booking_line_items WHERE id = $1`, [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}