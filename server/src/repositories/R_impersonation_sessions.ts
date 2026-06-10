import { Pool } from "pg";
import { IImpersonationSession, IR_impersonation_sessions } from "./IR_impersonation_sessions";

export class R_impersonation_sessions implements IR_impersonation_sessions {
  constructor(private db: Pool) {}

  async create(s: IImpersonationSession): Promise<IImpersonationSession> {
    const query = `
      INSERT INTO impersonation_sessions (bu_id, admin_user_id, target_user_id, reason, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      s.bu_id, s.admin_user_id, s.target_user_id, s.reason, s.created_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IImpersonationSession | null> {
    const { rows } = await this.db.query(`SELECT * FROM impersonation_sessions WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByAdmin(adminUserId: string): Promise<IImpersonationSession[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM impersonation_sessions WHERE admin_user_id = $1 ORDER BY started_at DESC`,
      [adminUserId]
    );
    return rows;
  }

  async getByTarget(targetUserId: string): Promise<IImpersonationSession[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM impersonation_sessions WHERE target_user_id = $1 ORDER BY started_at DESC`,
      [targetUserId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IImpersonationSession[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM impersonation_sessions WHERE bu_id = $1 ORDER BY started_at DESC`,
      [buId]
    );
    return rows;
  }

  async endSession(rowId: string): Promise<IImpersonationSession | null> {
    const { rows } = await this.db.query(
      `UPDATE impersonation_sessions SET ended_at = now(), db_last_upd = now() WHERE row_id = $1 RETURNING *`,
      [rowId]
    );
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM impersonation_sessions WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
