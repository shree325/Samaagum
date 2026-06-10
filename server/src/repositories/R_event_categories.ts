import { Pool } from "pg";
import { IEventCategory, IR_event_categories } from "./IR_event_categories";

export class R_event_categories implements IR_event_categories {
  constructor(private db: Pool) {}

  async create(category: IEventCategory): Promise<IEventCategory> {
    const query = `
      INSERT INTO event_categories (
        tenant_id, name, description, icon_url,
        status, display_order, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;
    const values = [
      category.tenant_id, category.name, category.description,
      category.icon_url, category.status, category.display_order,
      category.created_by, category.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IEventCategory | null> {
    const result = await this.db.query(
      `SELECT * FROM event_categories WHERE id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  async getAll(): Promise<IEventCategory[]> {
    const result = await this.db.query(
      `SELECT * FROM event_categories ORDER BY display_order ASC`
    );
    return result.rows;
  }

  async update(id: string, category: Partial<IEventCategory>): Promise<IEventCategory | null> {
    const result = await this.db.query(
      `
      UPDATE event_categories
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        icon_url = COALESCE($3, icon_url),
        status = COALESCE($4, status),
        display_order = COALESCE($5, display_order),
        updated_at = now(),
        updated_by = $6
      WHERE id = $7
      RETURNING *;
      `,
      [
        category.name, category.description, category.icon_url,
        category.status, category.display_order, category.updated_by, id,
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM event_categories WHERE id = $1`, [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}