import { Pool } from "pg";
import { IAuditLog, IR_audit_log } from "./IR_audit_log";

export class R_audit_log implements IR_audit_log {
  constructor(private db: Pool) {}

  async create(l: IAuditLog): Promise<IAuditLog> {
    const query = `
      INSERT INTO audit_log (bu_id, actor_id, action, resource_type, resource_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      l.bu_id, l.actor_id, l.action, l.resource_type, l.resource_id,
      l.metadata ? JSON.stringify(l.metadata) : null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IAuditLog | null> {
    const { rows } = await this.db.query(`SELECT * FROM audit_log WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByActor(actorId: string): Promise<IAuditLog[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM audit_log WHERE actor_id = $1 ORDER BY created DESC`,
      [actorId]
    );
    return rows;
  }

  async getByResource(resourceType: string, resourceId: string): Promise<IAuditLog[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM audit_log WHERE resource_type = $1 AND resource_id = $2 ORDER BY created DESC`,
      [resourceType, resourceId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IAuditLog[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM audit_log WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM audit_log WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
