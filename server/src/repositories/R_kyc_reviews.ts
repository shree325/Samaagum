import { Pool } from "pg";
import { IKycReviews, IR_kyc_reviews } from "./IR_kyc_reviews";

export class R_kyc_reviews implements IR_kyc_reviews {
  constructor(private db: Pool) {}

  async create(data: IKycReviews): Promise<IKycReviews> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO kyc_reviews (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IKycReviews | null> {
    const { rows } = await this.db.query('SELECT * FROM kyc_reviews WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IKycReviews[]> {
    const { rows } = await this.db.query('SELECT * FROM kyc_reviews');
    return rows;
  }

  async update(row_id: string, data: Partial<IKycReviews>): Promise<IKycReviews | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE kyc_reviews SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM kyc_reviews WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
