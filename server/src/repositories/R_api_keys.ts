import { Pool } from "pg";
import { IApiKeys, IR_api_keys } from "./IR_api_keys";

export class R_api_keys implements IR_api_keys {
  constructor(private db: Pool) {}

  async create(data: IApiKeys): Promise<IApiKeys> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO api_keys (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IApiKeys | null> {
    const { rows } = await this.db.query('SELECT * FROM api_keys WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IApiKeys[]> {
    const { rows } = await this.db.query('SELECT * FROM api_keys');
    return rows;
  }

  async update(row_id: string, data: Partial<IApiKeys>): Promise<IApiKeys | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE api_keys SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM api_keys WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
