import { IBaseRepository } from './IBaseRepository';

export interface IAuditLog {
  audit_id?: string;
  tenant_id?: string | null;
  actor_user_id?: string | null;
  action: string;
  target_table: string;
  target_entity_id?: string | null;
  before_json?: any;
  after_json?: any;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_auditLog extends IBaseRepository<IAuditLog> {
  findByTargetTable(targetTable: string): Promise<IAuditLog[]>;
  findByActorUserId(actorUserId: string): Promise<IAuditLog[]>;
}
