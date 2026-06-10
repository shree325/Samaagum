import { Pool } from "pg";
import { IApiClient, IR_api_clients } from "./IR_api_clients";

export class R_api_clients implements IR_api_clients {
  constructor(private db: Pool) {}

  async create(c: IApiClient): Promise<IApiClient> {
    const query = `
      INSERT INTO api_clients (bu_id, client_name, client_key, client_secret, status, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      c.bu_id, c.client_name, c.client_key, c.client_secret, c.status || 'active',
      c.x_data ? JSON.stringify(c.x_data) : null, c.created_by || null, c.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IApiClient | null> {
    const { rows } = await this.db.query(`SELECT * FROM api_clients WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByKey(clientKey: string): Promise<IApiClient | null> {
    const { rows } = await this.db.query(`SELECT * FROM api_clients WHERE client_key = $1`, [clientKey]);
    return rows[0] || null;
  }

  async getAll(buId: string): Promise<IApiClient[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM api_clients WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, c: Partial<IApiClient>): Promise<IApiClient | null> {
    const query = `
      UPDATE api_clients
      SET client_name = COALESCE($1, client_name),
          status = COALESCE($2, status),
          x_data = COALESCE($3, x_data),
          last_upd = now(),
          last_upd_by = $4,
          modification_num = modification_num + 1
      WHERE row_id = $5
      RETURNING *;
    `;
    const values = [
      c.client_name || null,
      c.status || null,
      c.x_data ? JSON.stringify(c.x_data) : null,
      c.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM api_clients WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
