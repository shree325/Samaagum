import { PrismaClient } from '@prisma/client';
import { ICollaboration, IR_collaborations } from "./IR_collaborations";

export class R_collaborations implements IR_collaborations {
  constructor(private db: PrismaClient) {}

  async create(c: ICollaboration): Promise<ICollaboration> {
    const query = `INSERT INTO collaborations (tenant_id, entity_id, name, slug, description, cover_asset_id, visibility, status, member_count, x_data, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *;`;
    const values = [c.tenant_id, c.entity_id, c.name, c.slug, c.description, c.cover_asset_id, c.visibility, c.status, c.member_count, c.x_data ? JSON.stringify(c.x_data) : null, c.created_by, c.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ICollaboration | null> {
    const result = await this.db.query(`SELECT * FROM collaborations WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByEntityId(entityId: string): Promise<ICollaboration | null> {
    const result = await this.db.query(`SELECT * FROM collaborations WHERE entity_id = $1`, [entityId]);
    return result.rows[0] || null;
  }

  async getBySlug(tenantId: string, slug: string): Promise<ICollaboration | null> {
    const result = await this.db.query(`SELECT * FROM collaborations WHERE tenant_id = $1 AND slug = $2`, [tenantId, slug]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<ICollaboration[]> {
    const result = await this.db.query(`SELECT * FROM collaborations ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, c: Partial<ICollaboration>): Promise<ICollaboration | null> {
    const result = await this.db.query(
      `UPDATE collaborations SET name = COALESCE($1, name), description = COALESCE($2, description), visibility = COALESCE($3, visibility), status = COALESCE($4, status), member_count = COALESCE($5, member_count), updated_at = now(), updated_by = $6 WHERE id = $7 RETURNING *;`,
      [c.name, c.description, c.visibility, c.status, c.member_count, c.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM collaborations WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
