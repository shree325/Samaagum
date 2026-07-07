import { PrismaClient } from '@prisma/client';
import { IEntity, IR_entities } from './IR_entities';

export class R_entities implements IR_entities {
  constructor(private db: PrismaClient) {}

  async create(entity: IEntity): Promise<IEntity> {
    const query = `
      INSERT INTO entities (
        tenant_id, entity_type, parent_entity_id, user_id, status, visibility
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;
    const values = [
      entity.tenant_id, entity.entity_type, entity.parent_entity_id,
      entity.user_id, entity.status ?? 'active', entity.visibility ?? 'public',
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IEntity | null> {
    const result = await this.db.query('SELECT * FROM entities WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getByTenant(tenantId: string): Promise<IEntity[]> {
    const result = await this.db.query(
      'SELECT * FROM entities WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }

  async getByParent(parentEntityId: string): Promise<IEntity[]> {
    const result = await this.db.query(
      'SELECT * FROM entities WHERE parent_entity_id = $1',
      [parentEntityId]
    );
    return result.rows;
  }

  async getByType(tenantId: string, entityType: string): Promise<IEntity[]> {
    const result = await this.db.query(
      'SELECT * FROM entities WHERE tenant_id = $1 AND entity_type = $2',
      [tenantId, entityType]
    );
    return result.rows;
  }

  async update(id: string, entity: Partial<IEntity>): Promise<IEntity | null> {
    const result = await this.db.query(
      `UPDATE entities SET
        status = COALESCE($1, status),
        visibility = COALESCE($2, visibility),
        parent_entity_id = COALESCE($3, parent_entity_id)
      WHERE id = $4
      RETURNING *;`,
      [entity.status, entity.visibility, entity.parent_entity_id, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM entities WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getOwnerUserId(entityId: string): Promise<string | null> {
    const result = await this.db.query('SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1', [entityId]);
    return result.rows[0]?.user_id || null;
  }

  async getParentEntityId(entityId: string): Promise<string | null> {
    const result = await this.db.query('SELECT parent_entity_id FROM entities WHERE id = $1::uuid LIMIT 1', [entityId]);
    return result.rows[0]?.parent_entity_id || null;
  }

  async getVisibility(entityId: string): Promise<string | null> {
    const result = await this.db.query('SELECT visibility FROM entities WHERE id = $1::uuid LIMIT 1', [entityId]);
    return result.rows[0]?.visibility || null;
  }

  async getUserEntity(userId: string): Promise<IEntity | null> {
    const result = await this.db.query(
      `SELECT * FROM entities WHERE user_id = $1::uuid AND entity_type = 'user' LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }
}


