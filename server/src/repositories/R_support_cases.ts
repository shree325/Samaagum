import { Pool } from "pg";
import { ISupportCases, IR_support_cases } from "./IR_support_cases";

export class R_support_cases implements IR_support_cases {
  constructor(private db: Pool) {}

  async create(data: ISupportCases): Promise<ISupportCases> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO support_cases (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<ISupportCases | null> {
    const { rows } = await this.db.query('SELECT * FROM support_cases WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<ISupportCases[]> {
    const { rows } = await this.db.query('SELECT * FROM support_cases');
    return rows;
  }

  async update(row_id: string, data: Partial<ISupportCases>): Promise<ISupportCases | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE support_cases SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM support_cases WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
