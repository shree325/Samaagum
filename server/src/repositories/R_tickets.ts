import { Pool } from "pg";
import { ITicket, IR_tickets } from "./IR_tickets";

export class R_tickets implements IR_tickets {
  constructor(private db: Pool) {}

  async create(t: ITicket): Promise<ITicket> {
    const query = `
      INSERT INTO tickets (
        tenant_id, booking_id, line_item_id, attendee_id,
        attendee_name, attendee_email, attendee_gender,
        ticket_number, qr_token, status,
        claimed_by_user_id, issued_at, transferable, seat_number,
        modification_num, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *;
    `;
    const values = [
      t.tenant_id, t.booking_id, t.line_item_id, t.attendee_id,
      t.attendee_name, t.attendee_email, t.attendee_gender,
      t.ticket_number, t.qr_token, t.status,
      t.claimed_by_user_id, t.issued_at, t.transferable, t.seat_number,
      t.modification_num ?? 0, t.created_by, t.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ITicket | null> {
    const result = await this.db.query(`SELECT * FROM tickets WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByTicketNumber(tenantId: string, ticketNumber: string): Promise<ITicket | null> {
    const result = await this.db.query(
      `SELECT * FROM tickets WHERE tenant_id = $1 AND ticket_number = $2`,
      [tenantId, ticketNumber]
    );
    return result.rows[0] || null;
  }

  async getByQrToken(tenantId: string, qrToken: string): Promise<ITicket | null> {
    const result = await this.db.query(
      `SELECT * FROM tickets WHERE tenant_id = $1 AND qr_token = $2`,
      [tenantId, qrToken]
    );
    return result.rows[0] || null;
  }

  async getByBookingId(bookingId: string): Promise<ITicket[]> {
    const result = await this.db.query(
      `SELECT * FROM tickets WHERE booking_id = $1`, [bookingId]
    );
    return result.rows;
  }

  async getByLineItemId(lineItemId: string): Promise<ITicket[]> {
    const result = await this.db.query(
      `SELECT * FROM tickets WHERE line_item_id = $1`, [lineItemId]
    );
    return result.rows;
  }

  async getByUserId(userId: string): Promise<ITicket[]> {
    const result = await this.db.query(
      `SELECT * FROM tickets WHERE claimed_by_user_id = $1`, [userId]
    );
    return result.rows;
  }

  async getAll(): Promise<ITicket[]> {
    const result = await this.db.query(`SELECT * FROM tickets ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, t: Partial<ITicket>): Promise<ITicket | null> {
    const result = await this.db.query(
      `
      UPDATE tickets
      SET
        attendee_name = COALESCE($1, attendee_name),
        attendee_email = COALESCE($2, attendee_email),
        status = COALESCE($3, status),
        claimed_by_user_id = COALESCE($4, claimed_by_user_id),
        revoked_at = COALESCE($5, revoked_at),
        seat_number = COALESCE($6, seat_number),
        updated_at = now(),
        updated_by = $7,
        modification_num = modification_num + 1
      WHERE id = $8
      RETURNING *;
      `,
      [
        t.attendee_name, t.attendee_email, t.status,
        t.claimed_by_user_id, t.revoked_at, t.seat_number,
        t.updated_by, id,
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM tickets WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}