import { Pool } from "pg";
import { IGroupMembership, IR_group_memberships } from "./IR_group_memberships";

export class R_group_memberships implements IR_group_memberships {
  constructor(private db: Pool) {}

  async create(gm: IGroupMembership): Promise<IGroupMembership> {
    const query = `
      INSERT INTO group_memberships (bu_id, par_row_id, user_id, role, status, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      gm.bu_id, gm.par_row_id, gm.user_id, gm.role || 'member', gm.status || 'active',
      gm.x_data ? JSON.stringify(gm.x_data) : null, gm.created_by || null, gm.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IGroupMembership | null> {
    const { rows } = await this.db.query(`SELECT * FROM group_memberships WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByGroupAndUser(groupId: string, userId: string): Promise<IGroupMembership | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM group_memberships WHERE par_row_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    return rows[0] || null;
  }

  async getByGroup(groupId: string): Promise<IGroupMembership[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM group_memberships WHERE par_row_id = $1 ORDER BY created DESC`,
      [groupId]
    );
    return rows;
  }

  async getByUser(userId: string): Promise<IGroupMembership[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM group_memberships WHERE user_id = $1 ORDER BY created DESC`,
      [userId]
    );
    return rows;
  }

  async update(rowId: string, gm: Partial<IGroupMembership>): Promise<IGroupMembership | null> {
    const query = `
      UPDATE group_memberships
      SET role = COALESCE($1, role),
          status = COALESCE($2, status),
          x_data = COALESCE($3, x_data),
          last_upd = now(),
          last_upd_by = $4,
          modification_num = modification_num + 1
      WHERE row_id = $5
      RETURNING *;
    `;
    const values = [
      gm.role || null,
      gm.status || null,
      gm.x_data ? JSON.stringify(gm.x_data) : null,
      gm.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM group_memberships WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
