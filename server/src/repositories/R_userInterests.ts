import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IUserInterest, IR_userInterests } from './IR_userInterests';
import pool from '../config/database';

export class R_userInterests extends PostgresBaseRepository<IUserInterest> implements IR_userInterests {
  constructor() {
    super('user_interests', 'user_id');
  }

  async findByUserId(userId: string): Promise<IUserInterest[]> {
    const query = `SELECT * FROM user_interests WHERE user_id = $1 ORDER BY priority DESC`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async findByCategoryId(categoryId: string): Promise<IUserInterest[]> {
    const query = `SELECT * FROM user_interests WHERE category_id = $1`;
    const { rows } = await pool.query(query, [categoryId]);
    return rows;
  }
}
