import { Pool } from "pg";
import { ITakeoverRequest, IR_takeover_requests } from "./IR_takeover_requests";

export class R_takeover_requests implements IR_takeover_requests {
  constructor(private db: Pool) {}

  async create(r: ITakeoverRequest): Promise<ITakeoverRequest> {
    const query = `
      INSERT INTO takeover_requests (bu_id, par_row_id, requested_by, reason, status, approved_by, approved_at, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      r.bu_id, r.par_row_id, r.requested_by, r.reason, r.status || 'pending',
      r.approved_by || null, r.approved_at || null, r.x_data ? JSON.stringify(r.x_data) : null,
      r.created_by || null, r.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<ITakeoverRequest | null> {
    const { rows } = await this.db.query(`SELECT * FROM takeover_requests WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByEntityId(entityId: string): Promise<ITakeoverRequest[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM takeover_requests WHERE par_row_id = $1 ORDER BY created DESC`,
      [entityId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<ITakeoverRequest[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM takeover_requests WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, r: Partial<ITakeoverRequest>): Promise<ITakeoverRequest | null> {
    const query = `
      UPDATE takeover_requests
      SET status = COALESCE($1, status),
          approved_by = COALESCE($2, approved_by),
          approved_at = COALESCE($3, approved_at),
          x_data = COALESCE($4, x_data),
          last_upd = now(),
          last_upd_by = $5,
          modification_num = modification_num + 1
      WHERE row_id = $6
      RETURNING *;
    `;
    const values = [
      r.status || null,
      r.approved_by || null,
      r.approved_at || null,
      r.x_data ? JSON.stringify(r.x_data) : null,
      r.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM takeover_requests WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
