import { PrismaClient } from '@prisma/client';
import { ICollaborationMember, IR_collaboration_members } from "./IR_collaboration_members";

export class R_collaboration_members implements IR_collaboration_members {
  constructor(private db: PrismaClient) {}

  async create(m: ICollaborationMember): Promise<ICollaborationMember> {
    const query = `INSERT INTO collaboration_members (tenant_id, collaboration_entity_id, user_id, role, state, joined_at, invited_by, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;`;
    const values = [m.tenant_id, m.collaboration_entity_id, m.user_id, m.role, m.state, m.joined_at, m.invited_by, m.created_by, m.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ICollaborationMember | null> {
    const result = await this.db.query(`SELECT * FROM collaboration_members WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByCollaborationEntityId(collabEntityId: string): Promise<ICollaborationMember[]> {
    const result = await this.db.query(`SELECT * FROM collaboration_members WHERE collaboration_entity_id = $1`, [collabEntityId]);
    return result.rows;
  }

  async getByUserId(userId: string): Promise<ICollaborationMember[]> {
    const result = await this.db.query(`SELECT * FROM collaboration_members WHERE user_id = $1`, [userId]);
    return result.rows;
  }

  async getAll(): Promise<ICollaborationMember[]> {
    const result = await this.db.query(`SELECT * FROM collaboration_members ORDER BY joined_at DESC`);
    return result.rows;
  }

  async update(id: string, m: Partial<ICollaborationMember>): Promise<ICollaborationMember | null> {
    const result = await this.db.query(
      `UPDATE collaboration_members SET role = COALESCE($1, role), state = COALESCE($2, state), left_at = COALESCE($3, left_at), updated_at = now(), updated_by = $4 WHERE id = $5 RETURNING *;`,
      [m.role, m.state, m.left_at, m.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM collaboration_members WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
