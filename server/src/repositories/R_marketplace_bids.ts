import { Pool } from "pg";
import { IMarketplaceBids, IR_marketplace_bids } from "./IR_marketplace_bids";

export class R_marketplace_bids implements IR_marketplace_bids {
  constructor(private db: Pool) {}

  async create(data: IMarketplaceBids): Promise<IMarketplaceBids> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO marketplace_bids (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IMarketplaceBids | null> {
    const { rows } = await this.db.query('SELECT * FROM marketplace_bids WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IMarketplaceBids[]> {
    const { rows } = await this.db.query('SELECT * FROM marketplace_bids');
    return rows;
  }

  async update(row_id: string, data: Partial<IMarketplaceBids>): Promise<IMarketplaceBids | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE marketplace_bids SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM marketplace_bids WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
