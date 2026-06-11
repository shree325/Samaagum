import { Pool } from "pg";
import { IModerationReports, IR_moderation_reports } from "./IR_moderation_reports";

export class R_moderation_reports implements IR_moderation_reports {
  constructor(private db: Pool) {}

  async create(data: IModerationReports): Promise<IModerationReports> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO moderation_reports (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IModerationReports | null> {
    const { rows } = await this.db.query('SELECT * FROM moderation_reports WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IModerationReports[]> {
    const { rows } = await this.db.query('SELECT * FROM moderation_reports');
    return rows;
  }

  async update(row_id: string, data: Partial<IModerationReports>): Promise<IModerationReports | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE moderation_reports SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM moderation_reports WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
