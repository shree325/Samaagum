export interface ITakeoverRequest {
  row_id?: string;
  bu_id: string;
  par_row_id: string; // Claimed Entity ID

  requested_by: string;
  reason: string;
  status?: string;
  approved_by?: string | null;
  approved_at?: Date | null;
  x_data?: Record<string, unknown> | null;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_takeover_requests {
  create(request: ITakeoverRequest): Promise<ITakeoverRequest>;
  getById(rowId: string): Promise<ITakeoverRequest | null>;
  getByEntityId(entityId: string): Promise<ITakeoverRequest[]>;
  getAll(buId: string): Promise<ITakeoverRequest[]>;
  update(rowId: string, request: Partial<ITakeoverRequest>): Promise<ITakeoverRequest | null>;
  delete(rowId: string): Promise<boolean>;
}
