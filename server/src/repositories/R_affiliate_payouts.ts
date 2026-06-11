import { PrismaClient } from '@prisma/client';
import { IAffiliatePayout, IR_affiliate_payouts } from "./IR_affiliate_payouts";

export class R_affiliate_payouts implements IR_affiliate_payouts {
  constructor(private db: PrismaClient) {}

  async create(p: IAffiliatePayout): Promise<IAffiliatePayout> {
    const query = `
      INSERT INTO affiliate_payouts (
        bu_id, par_row_id, amount_minor, currency, payout_method,
        payout_details, status, processed_at, x_data, created_by, last_upd_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      p.bu_id, p.par_row_id, p.amount_minor, p.currency || 'INR', p.payout_method,
      p.payout_details ? JSON.stringify(p.payout_details) : null, p.status || 'pending',
      p.processed_at || null, p.x_data ? JSON.stringify(p.x_data) : null,
      p.created_by || null, p.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IAffiliatePayout | null> {
    const { rows } = await this.db.query(`SELECT * FROM affiliate_payouts WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByAffiliateId(affiliateId: string): Promise<IAffiliatePayout[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM affiliate_payouts WHERE par_row_id = $1 ORDER BY created DESC`,
      [affiliateId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IAffiliatePayout[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM affiliate_payouts WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, p: Partial<IAffiliatePayout>): Promise<IAffiliatePayout | null> {
    const query = `
      UPDATE affiliate_payouts
      SET status = COALESCE($1, status),
          processed_at = COALESCE($2, processed_at),
          payout_details = COALESCE($3, payout_details),
          x_data = COALESCE($4, x_data),
          last_upd = now(),
          last_upd_by = $5,
          modification_num = modification_num + 1
      WHERE row_id = $6
      RETURNING *;
    `;
    const values = [
      p.status || null,
      p.processed_at || null,
      p.payout_details ? JSON.stringify(p.payout_details) : null,
      p.x_data ? JSON.stringify(p.x_data) : null,
      p.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM affiliate_payouts WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
