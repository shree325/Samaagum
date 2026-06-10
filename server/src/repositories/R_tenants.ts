import { Pool } from "pg";
import { ITenant, IR_tenants } from "./IR_tenants";

export class R_tenants implements IR_tenants {
  constructor(private db: Pool) {}

  async create(t: ITenant): Promise<ITenant> {
    const query = `
      INSERT INTO tenants (name, slug, status, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [t.name, t.slug, t.status || 'active', t.created_by || null, t.last_upd_by || null];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<ITenant | null> {
    const { rows } = await this.db.query(`SELECT * FROM tenants WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getBySlug(slug: string): Promise<ITenant | null> {
    const { rows } = await this.db.query(`SELECT * FROM tenants WHERE slug = $1`, [slug]);
    return rows[0] || null;
  }

  async getAll(): Promise<ITenant[]> {
    const { rows } = await this.db.query(`SELECT * FROM tenants ORDER BY created DESC`);
    return rows;
  }

  async update(rowId: string, t: Partial<ITenant>): Promise<ITenant | null> {
    const query = `
      UPDATE tenants
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          status = COALESCE($3, status),
          last_upd = now(),
          last_upd_by = $4,
          modification_num = modification_num + 1
      WHERE row_id = $5
      RETURNING *;
    `;
    const values = [t.name || null, t.slug || null, t.status || null, t.last_upd_by || null, rowId];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM tenants WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
