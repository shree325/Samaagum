import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAuthIdentity, IR_authIdentities } from './IR_authIdentities';
import pool from '../config/database';

export class R_authIdentities extends PostgresBaseRepository<IAuthIdentity> implements IR_authIdentities {
  constructor() {
    super('auth_identities', 'identity_id');
  }

  async findByUserId(userId: string): Promise<IAuthIdentity[]> {
    const query = `SELECT * FROM auth_identities WHERE user_id = $1`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async findByProvider(provider: string, providerUid: string): Promise<IAuthIdentity | null> {
    const query = `SELECT * FROM auth_identities WHERE provider = $1 AND provider_uid = $2`;
    const { rows } = await pool.query(query, [provider, providerUid]);
    return rows[0] || null;
  }
}
