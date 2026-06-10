import { Pool } from "pg";
import { IGroup, IR_groups } from "./IR_groups";

export class R_groups implements IR_groups {
  constructor(private db: Pool) {}

  async create(g: IGroup): Promise<IGroup> {
    const query = `
      INSERT INTO groups (bu_id, entity_id, par_row_id, name, description, status, pr_dept_ou_id, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      g.bu_id, g.entity_id, g.par_row_id || null, g.name, g.description || null,
      g.status || 'active', g.pr_dept_ou_id || null, g.x_data ? JSON.stringify(g.x_data) : null,
      g.created_by || null, g.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IGroup | null> {
    const { rows } = await this.db.query(`SELECT * FROM groups WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByEntityId(entityId: string): Promise<IGroup | null> {
    const { rows } = await this.db.query(`SELECT * FROM groups WHERE entity_id = $1`, [entityId]);
    return rows[0] || null;
  }

  async getByParentRowId(parRowId: string): Promise<IGroup[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM groups WHERE par_row_id = $1 ORDER BY name ASC`,
      [parRowId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IGroup[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM groups WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, g: Partial<IGroup>): Promise<IGroup | null> {
    const query = `
      UPDATE groups
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          pr_dept_ou_id = COALESCE($4, pr_dept_ou_id),
          x_data = COALESCE($5, x_data),
          last_upd = now(),
          last_upd_by = $6,
          modification_num = modification_num + 1
      WHERE row_id = $7
      RETURNING *;
    `;
    const values = [
      g.name || null,
      g.description || null,
      g.status || null,
      g.pr_dept_ou_id || null,
      g.x_data ? JSON.stringify(g.x_data) : null,
      g.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM groups WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
