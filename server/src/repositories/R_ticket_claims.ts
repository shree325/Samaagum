import { Pool } from "pg";
import { ITicketClaim, IR_ticket_claims } from "./IR_ticket_claims";

export class R_ticket_claims implements IR_ticket_claims {
  constructor(private db: Pool) {}

  async create(c: ITicketClaim): Promise<ITicketClaim> {
    const query = `
      INSERT INTO ticket_claims (
        tenant_id, ticket_id, token, expires_at,
        status, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;
    `;
    const values = [c.tenant_id, c.ticket_id, c.token, c.expires_at, c.status, c.created_by, c.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ITicketClaim | null> {
    const result = await this.db.query(`SELECT * FROM ticket_claims WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByToken(tenantId: string, token: string): Promise<ITicketClaim | null> {
    const result = await this.db.query(
      `SELECT * FROM ticket_claims WHERE tenant_id = $1 AND token = $2`, [tenantId, token]
    );
    return result.rows[0] || null;
  }

  async getByTicketId(ticketId: string): Promise<ITicketClaim[]> {
    const result = await this.db.query(`SELECT * FROM ticket_claims WHERE ticket_id = $1`, [ticketId]);
    return result.rows;
  }

  async getAll(): Promise<ITicketClaim[]> {
    const result = await this.db.query(`SELECT * FROM ticket_claims ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, c: Partial<ITicketClaim>): Promise<ITicketClaim | null> {
    const result = await this.db.query(
      `UPDATE ticket_claims SET
        status = COALESCE($1, status), claimed_at = COALESCE($2, claimed_at),
        claimed_user_id = COALESCE($3, claimed_user_id), otp_verified_at = COALESCE($4, otp_verified_at),
        attempt_count = COALESCE($5, attempt_count), updated_at = now(), updated_by = $6
      WHERE id = $7 RETURNING *;`,
      [c.status, c.claimed_at, c.claimed_user_id, c.otp_verified_at, c.attempt_count, c.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM ticket_claims WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
