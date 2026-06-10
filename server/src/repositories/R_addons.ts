import { Pool } from "pg";
import { IAddon, IR_addons } from "./IR_addons";

export class R_addons implements IR_addons {
  constructor(private db: Pool) {}

  async create(a: IAddon): Promise<IAddon> {
    const query = `
      INSERT INTO addons (bu_id, par_row_id, name, description, price_minor, currency, status, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      a.bu_id, a.par_row_id, a.name, a.description || null, a.price_minor || 0,
      a.currency || 'INR', a.status || 'active', a.x_data ? JSON.stringify(a.x_data) : null,
      a.created_by || null, a.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IAddon | null> {
    const { rows } = await this.db.query(`SELECT * FROM addons WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<IAddon[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM addons WHERE par_row_id = $1 ORDER BY name ASC`,
      [eventId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IAddon[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM addons WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, a: Partial<IAddon>): Promise<IAddon | null> {
    const query = `
      UPDATE addons
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
      a.name || null,
      a.description || null,
      a.price_minor === undefined ? null : a.price_minor,
      a.currency || null,
      a.status || null,
      a.x_data ? JSON.stringify(a.x_data) : null,
      a.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM addons WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
