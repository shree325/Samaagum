import { Pool } from "pg";
import { IBundle, IR_bundles } from "./IR_bundles";

export class R_bundles implements IR_bundles {
  constructor(private db: Pool) {}

  async create(b: IBundle): Promise<IBundle> {
    const query = `
      INSERT INTO bundles (bu_id, par_row_id, name, description, price_minor, currency, status, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      b.bu_id, b.par_row_id, b.name, b.description || null, b.price_minor || 0,
      b.currency || 'INR', b.status || 'active', b.x_data ? JSON.stringify(b.x_data) : null,
      b.created_by || null, b.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IBundle | null> {
    const { rows } = await this.db.query(`SELECT * FROM bundles WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<IBundle[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM bundles WHERE par_row_id = $1 ORDER BY name ASC`,
      [eventId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IBundle[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM bundles WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, b: Partial<IBundle>): Promise<IBundle | null> {
    const query = `
      UPDATE bundles
      SET name = COALESCE($1, name),
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
      b.name || null,
      b.description || null,
      b.price_minor === undefined ? null : b.price_minor,
      b.currency || null,
      b.status || null,
      b.x_data ? JSON.stringify(b.x_data) : null,
      b.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM bundles WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
