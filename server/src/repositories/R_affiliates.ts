import { Pool } from "pg";
import { IAffiliate, IR_affiliates } from "./IR_affiliates";

export class R_affiliates implements IR_affiliates {
  constructor(private db: Pool) {}

  async create(a: IAffiliate): Promise<IAffiliate> {
    const query = `INSERT INTO affiliates (tenant_id, owner_user_id, owner_entity_id, referral_code, status, payout_method, payout_details, x_data, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;`;
    const values = [a.tenant_id, a.owner_user_id, a.owner_entity_id, a.referral_code, a.status, a.payout_method, a.payout_details ? JSON.stringify(a.payout_details) : null, a.x_data ? JSON.stringify(a.x_data) : null, a.created_by, a.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IAffiliate | null> {
    const result = await this.db.query(`SELECT * FROM affiliates WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByReferralCode(tenantId: string, code: string): Promise<IAffiliate | null> {
    const result = await this.db.query(`SELECT * FROM affiliates WHERE tenant_id = $1 AND referral_code = $2`, [tenantId, code]);
    return result.rows[0] || null;
  }

  async getByOwnerUserId(userId: string): Promise<IAffiliate[]> {
    const result = await this.db.query(`SELECT * FROM affiliates WHERE owner_user_id = $1`, [userId]);
    return result.rows;
  }

  async getAll(): Promise<IAffiliate[]> {
    const result = await this.db.query(`SELECT * FROM affiliates ORDER BY joined_at DESC`);
    return result.rows;
  }

  async update(id: string, a: Partial<IAffiliate>): Promise<IAffiliate | null> {
    const result = await this.db.query(
      `UPDATE affiliates SET status = COALESCE($1, status), payout_method = COALESCE($2, payout_method), payout_details = COALESCE($3, payout_details), updated_at = now(), updated_by = $4 WHERE id = $5 RETURNING *;`,
      [a.status, a.payout_method, a.payout_details ? JSON.stringify(a.payout_details) : null, a.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM affiliates WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
