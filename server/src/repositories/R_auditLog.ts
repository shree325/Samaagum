import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAuditLog, IR_auditLog } from './IR_auditLog';
import pool from '../config/database';

export class R_auditLog extends PostgresBaseRepository<IAuditLog> implements IR_auditLog {
  constructor() {
    super('audit_log', 'audit_id');
  }

  async findByTargetTable(targetTable: string): Promise<IAuditLog[]> {
    const query = `SELECT * FROM audit_log WHERE target_table = $1`;
    const { rows } = await pool.query(query, [targetTable]);
    return rows;
  }

  async findByActorUserId(actorUserId: string): Promise<IAuditLog[]> {
    const query = `SELECT * FROM audit_log WHERE actor_user_id = $1`;
    const { rows } = await pool.query(query, [actorUserId]);
    return rows;
  }
}
