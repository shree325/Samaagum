import { IBaseRepository } from './IBaseRepository';

export interface IAuditLog {
  audit_id?: string;
  tenant_id?: string | null;
  actor_user_id?: string | null;

  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other';
  target_table: string;
  target_entity_id?: string | null;

  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;

  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;

  created_at?: Date;
  updated_at?: Date;
}

export interface IR_audit_log extends IBaseRepository<IAuditLog> {
  findByActor(actorUserId: string): Promise<IAuditLog[]>;
  findByTargetTable(targetTable: string): Promise<IAuditLog[]>;
  findByTargetEntity(targetEntityId: string): Promise<IAuditLog[]>;
  findByTenant(tenantId: string): Promise<IAuditLog[]>;
}
