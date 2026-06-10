import { Pool } from "pg";
import { ICategory, IR_categories } from "./IR_categories";

export class R_categories implements IR_categories {
  constructor(private db: Pool) {}

  async create(c: ICategory): Promise<ICategory> {
    const query = `
      INSERT INTO categories (bu_id, par_row_id, name, slug, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      c.bu_id, c.par_row_id || null, c.name, c.slug,
      c.created_by || null, c.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<ICategory | null> {
    const { rows } = await this.db.query(`SELECT * FROM categories WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getBySlug(buId: string, slug: string): Promise<ICategory | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM categories WHERE bu_id = $1 AND slug = $2`,
      [buId, slug]
    );
    return rows[0] || null;
  }

  async getByParentId(parentId: string): Promise<ICategory[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM categories WHERE par_row_id = $1 ORDER BY name ASC`,
      [parentId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<ICategory[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM categories WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, c: Partial<ICategory>): Promise<ICategory | null> {
    const query = `
      UPDATE categories
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          par_row_id = COALESCE($3, par_row_id),
          last_upd = now(),
          last_upd_by = $4,
          modification_num = modification_num + 1
      WHERE row_id = $5
      RETURNING *;
    `;
    const values = [
      c.name || null,
      c.slug || null,
      c.par_row_id || null,
      c.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM categories WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
