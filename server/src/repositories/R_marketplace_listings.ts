import { PrismaClient } from '@prisma/client';
import { IMarketplaceListing, IR_marketplace_listings } from "./IR_marketplace_listings";

export class R_marketplace_listings implements IR_marketplace_listings {
  constructor(private db: PrismaClient) {}

  async create(l: IMarketplaceListing): Promise<IMarketplaceListing> {
    const query = `
      INSERT INTO marketplace_listings (
        bu_id, par_row_id, title, description, price_minor, currency, status, x_data, created_by, last_upd_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      l.bu_id, l.par_row_id, l.title, l.description || null, l.price_minor || 0,
      l.currency || 'INR', l.status || 'active', l.x_data ? JSON.stringify(l.x_data) : null,
      l.created_by || null, l.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IMarketplaceListing | null> {
    const { rows } = await this.db.query(`SELECT * FROM marketplace_listings WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getBySellerEntityId(sellerEntityId: string): Promise<IMarketplaceListing[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM marketplace_listings WHERE par_row_id = $1 ORDER BY created DESC`,
      [sellerEntityId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IMarketplaceListing[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM marketplace_listings WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, l: Partial<IMarketplaceListing>): Promise<IMarketplaceListing | null> {
    const query = `
      UPDATE marketplace_listings
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          price_minor = COALESCE($3, price_minor),
          currency = COALESCE($4, currency),
          status = COALESCE($5, status),
          x_data = COALESCE($6, x_data),
          last_upd = now(),
          last_upd_by = $7,
          modification_num = modification_num + 1
      WHERE row_id = $8
      RETURNING *;
    `;
    const values = [
      l.title || null,
      l.description || null,
      l.price_minor === undefined ? null : l.price_minor,
      l.currency || null,
      l.status || null,
      l.x_data ? JSON.stringify(l.x_data) : null,
      l.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM marketplace_listings WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
