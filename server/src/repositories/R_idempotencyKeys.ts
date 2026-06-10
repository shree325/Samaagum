import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IIdempotencyKey, IR_idempotencyKeys } from './IR_idempotencyKeys';
import pool from '../config/database';

export class R_idempotencyKeys extends PostgresBaseRepository<IIdempotencyKey> implements IR_idempotencyKeys {
  constructor() {
    super('idempotency_keys', 'key');
  }

  async findByKey(key: string): Promise<IIdempotencyKey | null> {
    const query = `SELECT * FROM idempotency_keys WHERE key = $1`;
    const { rows } = await pool.query(query, [key]);
    return rows[0] || null;
  }

  async findExpired(): Promise<IIdempotencyKey[]> {
    const query = `SELECT * FROM idempotency_keys WHERE expires_at IS NOT NULL AND expires_at < NOW()`;
    const { rows } = await pool.query(query);
    return rows;
  }
}
