import { Pool } from 'pg';
import { ITicket, IR_tickets } from './IR_tickets';

export class R_tickets implements IR_tickets {
  constructor(private db: Pool) {}

  async create(ticket: ITicket): Promise<ITicket> {
    const query = `
      INSERT INTO tickets (
        tenant_id, line_item_id, attendee_name, attendee_email,
        attendee_gender, qr_token, status, claimed_by_user_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;
    const values = [
      ticket.tenant_id, ticket.line_item_id, ticket.attendee_name,
      ticket.attendee_email, ticket.attendee_gender, ticket.qr_token,
      ticket.status ?? 'reserved', ticket.claimed_by_user_id,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ITicket | null> {
    const result = await this.db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getByQrToken(qrToken: string): Promise<ITicket | null> {
    const result = await this.db.query(
      'SELECT * FROM tickets WHERE qr_token = $1',
      [qrToken]
    );
    return result.rows[0] || null;
  }

  async getByLineItemId(lineItemId: string): Promise<ITicket[]> {
    const result = await this.db.query(
      'SELECT * FROM tickets WHERE line_item_id = $1',
      [lineItemId]
    );
    return result.rows;
  }

  async getByUserId(userId: string): Promise<ITicket[]> {
    const result = await this.db.query(
      'SELECT * FROM tickets WHERE claimed_by_user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async getAll(): Promise<ITicket[]> {
    const result = await this.db.query('SELECT * FROM tickets ORDER BY created_at DESC');
    return result.rows;
  }

  async update(id: string, ticket: Partial<ITicket>): Promise<ITicket | null> {
    const result = await this.db.query(
      `UPDATE tickets SET
        attendee_name = COALESCE($1, attendee_name),
        attendee_email = COALESCE($2, attendee_email),
        status = COALESCE($3, status),
        claimed_by_user_id = COALESCE($4, claimed_by_user_id)
      WHERE id = $5
      RETURNING *;`,
      [ticket.attendee_name, ticket.attendee_email, ticket.status, ticket.claimed_by_user_id, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM tickets WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}