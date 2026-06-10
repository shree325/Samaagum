import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IReview, IR_reviews } from './IR_reviews';
import pool from '../config/database';

export class R_reviews extends PostgresBaseRepository<IReview> implements IR_reviews {
  constructor() {
    super('reviews', 'review_id');
  }

  async findByTargetEntityId(targetEntityId: string): Promise<IReview[]> {
    const query = `SELECT * FROM reviews WHERE target_entity_id = $1`;
    const { rows } = await pool.query(query, [targetEntityId]);
    return rows;
  }

  async findByReviewerUserId(reviewerUserId: string): Promise<IReview[]> {
    const query = `SELECT * FROM reviews WHERE reviewer_user_id = $1`;
    const { rows } = await pool.query(query, [reviewerUserId]);
    return rows;
  }
}
