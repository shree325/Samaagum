import { Pool } from "pg";
import { IBundleItems, IR_bundle_items } from "./IR_bundle_items";

export class R_bundle_items implements IR_bundle_items {
  constructor(private db: Pool) {}

  async create(data: IBundleItems): Promise<IBundleItems> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO bundle_items (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IBundleItems | null> {
    const { rows } = await this.db.query('SELECT * FROM bundle_items WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IBundleItems[]> {
    const { rows } = await this.db.query('SELECT * FROM bundle_items');
    return rows;
  }

  async update(row_id: string, data: Partial<IBundleItems>): Promise<IBundleItems | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE bundle_items SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM bundle_items WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
