import { Pool } from "pg";
import { IDisputes, IR_disputes } from "./IR_disputes";

export class R_disputes implements IR_disputes {
  constructor(private db: Pool) {}

  async create(data: IDisputes): Promise<IDisputes> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO disputes (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IDisputes | null> {
    const { rows } = await this.db.query('SELECT * FROM disputes WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IDisputes[]> {
    const { rows } = await this.db.query('SELECT * FROM disputes');
    return rows;
  }

  async update(row_id: string, data: Partial<IDisputes>): Promise<IDisputes | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE disputes SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM disputes WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
