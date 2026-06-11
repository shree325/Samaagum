import { Pool } from "pg";
import { IKycSubmissions, IR_kyc_submissions } from "./IR_kyc_submissions";

export class R_kyc_submissions implements IR_kyc_submissions {
  constructor(private db: Pool) {}

  async create(data: IKycSubmissions): Promise<IKycSubmissions> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO kyc_submissions (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IKycSubmissions | null> {
    const { rows } = await this.db.query('SELECT * FROM kyc_submissions WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IKycSubmissions[]> {
    const { rows } = await this.db.query('SELECT * FROM kyc_submissions');
    return rows;
  }

  async update(row_id: string, data: Partial<IKycSubmissions>): Promise<IKycSubmissions | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE kyc_submissions SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM kyc_submissions WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
