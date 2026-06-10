export interface IIdempotencyKey {
  row_id?: string;
  bu_id: string;
  idempotency_key: string;
  request_hash: string;
  response_data?: Record<string, unknown> | null;
  expires_at: Date;

  created?: Date;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_idempotency_keys {
  create(key: IIdempotencyKey): Promise<IIdempotencyKey>;
  getById(rowId: string): Promise<IIdempotencyKey | null>;
  getByKey(buId: string, idempotencyKey: string): Promise<IIdempotencyKey | null>;
  updateResponse(buId: string, idempotencyKey: string, responseData: Record<string, unknown>): Promise<IIdempotencyKey | null>;
  delete(rowId: string): Promise<boolean>;
}
