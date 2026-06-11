import { PrismaClient } from '@prisma/client';
import { ISubCommunity, IR_sub_communities } from "./IR_sub_communities";

export class R_sub_communities implements IR_sub_communities {
  constructor(private db: PrismaClient) {}

  async create(s: ISubCommunity): Promise<ISubCommunity> {
    const query = `INSERT INTO sub_communities (tenant_id, entity_id, community_entity_id, name, slug, description, cover_asset_id, visibility, status, member_count, x_data, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *;`;
    const values = [s.tenant_id, s.entity_id, s.community_entity_id, s.name, s.slug, s.description, s.cover_asset_id, s.visibility, s.status, s.member_count, s.x_data ? JSON.stringify(s.x_data) : null, s.created_by, s.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ISubCommunity | null> {
    const result = await this.db.query(`SELECT * FROM sub_communities WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByCommunityEntityId(communityEntityId: string): Promise<ISubCommunity[]> {
    const result = await this.db.query(`SELECT * FROM sub_communities WHERE community_entity_id = $1`, [communityEntityId]);
    return result.rows;
  }

  async getBySlug(tenantId: string, slug: string): Promise<ISubCommunity | null> {
    const result = await this.db.query(`SELECT * FROM sub_communities WHERE tenant_id = $1 AND slug = $2`, [tenantId, slug]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<ISubCommunity[]> {
    const result = await this.db.query(`SELECT * FROM sub_communities ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, s: Partial<ISubCommunity>): Promise<ISubCommunity | null> {
    const result = await this.db.query(
      `UPDATE sub_communities SET name = COALESCE($1, name), description = COALESCE($2, description), visibility = COALESCE($3, visibility), status = COALESCE($4, status), member_count = COALESCE($5, member_count), updated_at = now(), updated_by = $6 WHERE id = $7 RETURNING *;`,
      [s.name, s.description, s.visibility, s.status, s.member_count, s.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM sub_communities WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
