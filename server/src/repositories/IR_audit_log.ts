export interface IAuditLog {
  row_id?: string;
  bu_id: string;

  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata?: Record<string, unknown> | null;

  created?: Date;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_audit_log {
  create(log: IAuditLog): Promise<IAuditLog>;
  getById(rowId: string): Promise<IAuditLog | null>;
  getByActor(actorId: string): Promise<IAuditLog[]>;
  getByResource(resourceType: string, resourceId: string): Promise<IAuditLog[]>;
  getAll(buId: string): Promise<IAuditLog[]>;
  delete(rowId: string): Promise<boolean>;
}
