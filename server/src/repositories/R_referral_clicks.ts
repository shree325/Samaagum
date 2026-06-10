import { Pool } from "pg";
import { IReferralClick, IR_referral_clicks } from "./IR_referral_clicks";

export class R_referral_clicks implements IR_referral_clicks {
  constructor(private db: Pool) {}

  async create(rc: IReferralClick): Promise<IReferralClick> {
    const query = `
      INSERT INTO referral_clicks (bu_id, par_row_id, ip_address, user_agent, device_type, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      rc.bu_id, rc.par_row_id, rc.ip_address || null, rc.user_agent || null,
      rc.device_type || null, rc.created_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IReferralClick | null> {
    const { rows } = await this.db.query(`SELECT * FROM referral_clicks WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByReferralLinkId(referralLinkId: string): Promise<IReferralClick[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM referral_clicks WHERE par_row_id = $1 ORDER BY clicked_at DESC`,
      [referralLinkId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IReferralClick[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM referral_clicks WHERE bu_id = $1 ORDER BY clicked_at DESC`,
      [buId]
    );
    return rows;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM referral_clicks WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
