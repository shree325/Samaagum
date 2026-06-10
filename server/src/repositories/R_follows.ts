import { Pool } from "pg";
import { IFollow, IR_follows } from "./IR_follows";

export class R_follows implements IR_follows {
  constructor(private db: Pool) {}

  async create(f: IFollow): Promise<IFollow> {
    const query = `INSERT INTO follows (tenant_id, user_id, entity_id, follow_state, muted, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;`;
    const values = [f.tenant_id, f.user_id, f.entity_id, f.follow_state, f.muted, f.created_by, f.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IFollow | null> {
    const result = await this.db.query(`SELECT * FROM follows WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByUserId(userId: string): Promise<IFollow[]> {
    const result = await this.db.query(`SELECT * FROM follows WHERE user_id = $1`, [userId]);
    return result.rows;
  }

  async getByEntityId(entityId: string): Promise<IFollow[]> {
    const result = await this.db.query(`SELECT * FROM follows WHERE entity_id = $1`, [entityId]);
    return result.rows;
  }

  async getByUserAndEntity(userId: string, entityId: string): Promise<IFollow | null> {
    const result = await this.db.query(`SELECT * FROM follows WHERE user_id = $1 AND entity_id = $2`, [userId, entityId]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<IFollow[]> {
    const result = await this.db.query(`SELECT * FROM follows ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, f: Partial<IFollow>): Promise<IFollow | null> {
    const result = await this.db.query(
      `UPDATE follows SET follow_state = COALESCE($1, follow_state), muted = COALESCE($2, muted), updated_at = now(), updated_by = $3 WHERE id = $4 RETURNING *;`,
      [f.follow_state, f.muted, f.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM follows WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
