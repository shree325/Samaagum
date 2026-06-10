import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IProfile, IR_profiles } from './IR_profiles';
import pool from '../config/database';

export class R_profiles extends PostgresBaseRepository<IProfile> implements IR_profiles {
  constructor() {
    super('profiles', 'user_id');
  }

  async findByDisplayName(displayName: string): Promise<IProfile[]> {
    const query = `SELECT * FROM profiles WHERE display_name ILIKE $1`;
    const { rows } = await pool.query(query, [`%${displayName}%`]);
    return rows;
  }
}
