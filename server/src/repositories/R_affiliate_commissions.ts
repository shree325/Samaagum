import { Pool } from "pg";
import { IAffiliateCommissions, IR_affiliate_commissions } from "./IR_affiliate_commissions";

export class R_affiliate_commissions implements IR_affiliate_commissions {
  constructor(private db: Pool) {}

  async create(data: IAffiliateCommissions): Promise<IAffiliateCommissions> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO affiliate_commissions (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IAffiliateCommissions | null> {
    const { rows } = await this.db.query('SELECT * FROM affiliate_commissions WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IAffiliateCommissions[]> {
    const { rows } = await this.db.query('SELECT * FROM affiliate_commissions');
    return rows;
  }

  async update(row_id: string, data: Partial<IAffiliateCommissions>): Promise<IAffiliateCommissions | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE affiliate_commissions SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM affiliate_commissions WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
