import { Pool } from "pg";
import { ICommission, IR_commissions } from "./IR_commissions";

export class R_commissions implements IR_commissions {
  constructor(private db: Pool) {}

  async create(c: ICommission): Promise<ICommission> {
    const query = `INSERT INTO commissions (tenant_id, affiliate_id, source_type, source_id, amount_minor, currency, state, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;`;
    const values = [c.tenant_id, c.affiliate_id, c.source_type, c.source_id, c.amount_minor, c.currency, c.state, c.created_by, c.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ICommission | null> {
    const result = await this.db.query(`SELECT * FROM commissions WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByAffiliateId(affiliateId: string): Promise<ICommission[]> {
    const result = await this.db.query(`SELECT * FROM commissions WHERE affiliate_id = $1 ORDER BY earned_at DESC`, [affiliateId]);
    return result.rows;
  }

  async getByState(state: string): Promise<ICommission[]> {
    const result = await this.db.query(`SELECT * FROM commissions WHERE state = $1`, [state]);
    return result.rows;
  }

  async getAll(): Promise<ICommission[]> {
    const result = await this.db.query(`SELECT * FROM commissions ORDER BY earned_at DESC`);
    return result.rows;
  }

  async update(id: string, c: Partial<ICommission>): Promise<ICommission | null> {
    const result = await this.db.query(
      `UPDATE commissions SET state = COALESCE($1, state), approved_at = COALESCE($2, approved_at), paid_at = COALESCE($3, paid_at), updated_at = now(), updated_by = $4 WHERE id = $5 RETURNING *;`,
      [c.state, c.approved_at, c.paid_at, c.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM commissions WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
