import { Pool } from "pg";
import { IBadges, IR_badges } from "./IR_badges";

export class R_badges implements IR_badges {
  constructor(private db: Pool) {}

  async create(data: IBadges): Promise<IBadges> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO badges (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IBadges | null> {
    const { rows } = await this.db.query('SELECT * FROM badges WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IBadges[]> {
    const { rows } = await this.db.query('SELECT * FROM badges');
    return rows;
  }

  async update(row_id: string, data: Partial<IBadges>): Promise<IBadges | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE badges SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM badges WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
