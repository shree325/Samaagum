import { IBaseRepository } from './IBaseRepository';

export interface IIdempotencyKey {
  key: string;
  scope?: string;
  tenant_id?: string | null;
  scope_entity_id?: string | null;
  first_seen_at?: Date;
  response_hash?: string | null;
  expires_at?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_idempotencyKeys extends IBaseRepository<IIdempotencyKey> {
  findByKey(key: string): Promise<IIdempotencyKey | null>;
  findExpired(): Promise<IIdempotencyKey[]>;
}
