import { Pool } from "pg";
import { IReferralLink, IR_referral_links } from "./IR_referral_links";

export class R_referral_links implements IR_referral_links {
  constructor(private db: Pool) {}

  async create(l: IReferralLink): Promise<IReferralLink> {
    const query = `INSERT INTO referral_links (tenant_id, affiliate_id, code, destination_url, campaign_name, status, expires_at, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;`;
    const values = [l.tenant_id, l.affiliate_id, l.code, l.destination_url, l.campaign_name, l.status, l.expires_at, l.created_by, l.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IReferralLink | null> {
    const result = await this.db.query(`SELECT * FROM referral_links WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByCode(tenantId: string, code: string): Promise<IReferralLink | null> {
    const result = await this.db.query(`SELECT * FROM referral_links WHERE tenant_id = $1 AND code = $2`, [tenantId, code]);
    return result.rows[0] || null;
  }

  async getByAffiliateId(affiliateId: string): Promise<IReferralLink[]> {
    const result = await this.db.query(`SELECT * FROM referral_links WHERE affiliate_id = $1`, [affiliateId]);
    return result.rows;
  }

  async getAll(): Promise<IReferralLink[]> {
    const result = await this.db.query(`SELECT * FROM referral_links ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, l: Partial<IReferralLink>): Promise<IReferralLink | null> {
    const result = await this.db.query(
      `UPDATE referral_links SET status = COALESCE($1, status), clicked_count = COALESCE($2, clicked_count), converted_count = COALESCE($3, converted_count), updated_at = now(), updated_by = $4 WHERE id = $5 RETURNING *;`,
      [l.status, l.clicked_count, l.converted_count, l.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM referral_links WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
