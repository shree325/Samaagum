import { Pool } from "pg";
import { IPlatformSettings, IR_platform_settings } from "./IR_platform_settings";

export class R_platform_settings implements IR_platform_settings {
  constructor(private db: Pool) {}

  async create(data: IPlatformSettings): Promise<IPlatformSettings> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO platform_settings (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IPlatformSettings | null> {
    const { rows } = await this.db.query('SELECT * FROM platform_settings WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IPlatformSettings[]> {
    const { rows } = await this.db.query('SELECT * FROM platform_settings');
    return rows;
  }

  async update(row_id: string, data: Partial<IPlatformSettings>): Promise<IPlatformSettings | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE platform_settings SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM platform_settings WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
