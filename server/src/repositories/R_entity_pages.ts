import { Pool } from "pg";
import { IEntityPage, IR_entity_pages } from "./IR_entity_pages";

export class R_entity_pages implements IR_entity_pages {
  constructor(private db: Pool) {}

  async create(p: IEntityPage): Promise<IEntityPage> {
    const query = `INSERT INTO entity_pages (tenant_id, owner_entity_id, page_type, slug, title, content_blocks, listed, status, published_at, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *;`;
    const values = [p.tenant_id, p.owner_entity_id, p.page_type, p.slug, p.title, p.content_blocks ? JSON.stringify(p.content_blocks) : null, p.listed, p.status, p.published_at, p.created_by, p.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IEntityPage | null> {
    const result = await this.db.query(`SELECT * FROM entity_pages WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByOwnerEntityId(ownerEntityId: string): Promise<IEntityPage[]> {
    const result = await this.db.query(`SELECT * FROM entity_pages WHERE owner_entity_id = $1`, [ownerEntityId]);
    return result.rows;
  }

  async getBySlug(ownerEntityId: string, slug: string): Promise<IEntityPage | null> {
    const result = await this.db.query(`SELECT * FROM entity_pages WHERE owner_entity_id = $1 AND slug = $2`, [ownerEntityId, slug]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<IEntityPage[]> {
    const result = await this.db.query(`SELECT * FROM entity_pages ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, p: Partial<IEntityPage>): Promise<IEntityPage | null> {
    const result = await this.db.query(
      `UPDATE entity_pages SET title = COALESCE($1, title), content_blocks = COALESCE($2, content_blocks), listed = COALESCE($3, listed), status = COALESCE($4, status), published_at = COALESCE($5, published_at), updated_at = now(), updated_by = $6 WHERE id = $7 RETURNING *;`,
      [p.title, p.content_blocks ? JSON.stringify(p.content_blocks) : null, p.listed, p.status, p.published_at, p.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM entity_pages WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
