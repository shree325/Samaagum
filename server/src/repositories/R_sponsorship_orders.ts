import { PrismaClient } from '@prisma/client';
import { ISponsorshipOrder, IR_sponsorship_orders } from "./IR_sponsorship_orders";

export class R_sponsorship_orders implements IR_sponsorship_orders {
  constructor(private db: PrismaClient) {}

  async create(o: ISponsorshipOrder): Promise<ISponsorshipOrder> {
    const query = `INSERT INTO sponsorship_orders (tenant_id, package_id, sponsor_entity_id, status, amount_minor, currency, creative_asset_id, approved_by, activated_at, expires_at, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *;`;
    const values = [o.tenant_id, o.package_id, o.sponsor_entity_id, o.status, o.amount_minor, o.currency, o.creative_asset_id, o.approved_by, o.activated_at, o.expires_at, o.created_by, o.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ISponsorshipOrder | null> {
    const result = await this.db.query(`SELECT * FROM sponsorship_orders WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByPackageId(packageId: string): Promise<ISponsorshipOrder[]> {
    const result = await this.db.query(`SELECT * FROM sponsorship_orders WHERE package_id = $1`, [packageId]);
    return result.rows;
  }

  async getBySponsorEntityId(sponsorEntityId: string): Promise<ISponsorshipOrder[]> {
    const result = await this.db.query(`SELECT * FROM sponsorship_orders WHERE sponsor_entity_id = $1`, [sponsorEntityId]);
    return result.rows;
  }

  async getAll(): Promise<ISponsorshipOrder[]> {
    const result = await this.db.query(`SELECT * FROM sponsorship_orders ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, o: Partial<ISponsorshipOrder>): Promise<ISponsorshipOrder | null> {
    const result = await this.db.query(
      `UPDATE sponsorship_orders SET status = COALESCE($1, status), approved_by = COALESCE($2, approved_by), activated_at = COALESCE($3, activated_at), expires_at = COALESCE($4, expires_at), updated_at = now(), updated_by = $5 WHERE id = $6 RETURNING *;`,
      [o.status, o.approved_by, o.activated_at, o.expires_at, o.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM sponsorship_orders WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
