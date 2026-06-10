import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IUser, IR_users } from './IR_users';
import pool from '../config/database';

export class R_users extends PostgresBaseRepository<IUser> implements IR_users {
  constructor() {
    super('users', 'user_id');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const query = `SELECT * FROM users WHERE primary_email = $1`;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  }
}
