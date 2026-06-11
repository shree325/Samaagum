import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAuditLog, IR_audit_log } from './IR_audit_log';
import pool from '../config/database';

export class R_audit_log extends PostgresBaseRepository<IAuditLog> implements IR_audit_log {
  constructor() {
    super('audit_log', 'audit_id');
  }

  async findByActor(actorUserId: string): Promise<IAuditLog[]> {
    const { rows } = await pool.query(
      `SELECT * FROM audit_log WHERE actor_user_id = $1 ORDER BY created_at DESC`,
      [actorUserId]
    );
    return rows;
  }

  async findByTargetTable(targetTable: string): Promise<IAuditLog[]> {
    const { rows } = await pool.query(
      `SELECT * FROM audit_log WHERE target_table = $1 ORDER BY created_at DESC`,
      [targetTable]
    );
    return rows;
  }

  async findByTargetEntity(targetEntityId: string): Promise<IAuditLog[]> {
    const { rows } = await pool.query(
      `SELECT * FROM audit_log WHERE target_entity_id = $1 ORDER BY created_at DESC`,
      [targetEntityId]
    );
    return rows;
  }

  async findByTenant(tenantId: string): Promise<IAuditLog[]> {
    const { rows } = await pool.query(
      `SELECT * FROM audit_log WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return rows;
  }
}
