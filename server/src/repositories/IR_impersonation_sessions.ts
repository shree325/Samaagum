export interface IImpersonationSession {
  row_id?: string;
  bu_id: string;

  admin_user_id: string;
  target_user_id: string;
  started_at?: Date;
  ended_at?: Date | null;
  reason: string;

  created?: Date;
  created_by?: string | null;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_impersonation_sessions {
  create(session: IImpersonationSession): Promise<IImpersonationSession>;
  getById(rowId: string): Promise<IImpersonationSession | null>;
  getByAdmin(adminUserId: string): Promise<IImpersonationSession[]>;
  getByTarget(targetUserId: string): Promise<IImpersonationSession[]>;
  getAll(buId: string): Promise<IImpersonationSession[]>;
  endSession(rowId: string): Promise<IImpersonationSession | null>;
  delete(rowId: string): Promise<boolean>;
}
