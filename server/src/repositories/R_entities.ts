import { Pool } from "pg";
import { IEntity, IR_entities } from "./IR_entities";

export class R_entities implements IR_entities {
  constructor(private db: Pool) {}

  async create(e: IEntity): Promise<IEntity> {
    const query = `
      INSERT INTO entities (bu_id, entity_type, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [e.bu_id, e.entity_type, e.created_by || null, e.last_upd_by || null];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IEntity | null> {
    const { rows } = await this.db.query(`SELECT * FROM entities WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByType(buId: string, entityType: string): Promise<IEntity[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM entities WHERE bu_id = $1 AND entity_type = $2 ORDER BY created DESC`,
      [buId, entityType]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IEntity[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM entities WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, e: Partial<IEntity>): Promise<IEntity | null> {
    const query = `
      UPDATE entities
      SET entity_type = COALESCE($1, entity_type),
          last_upd = now(),
          last_upd_by = $2,
          modification_num = modification_num + 1
      WHERE row_id = $3
      RETURNING *;
    `;
    const values = [e.entity_type || null, e.last_upd_by || null, rowId];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM entities WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
