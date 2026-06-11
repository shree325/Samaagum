import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IRating, IR_ratings } from './IR_ratings';
import prisma from '../config/prisma';

export class R_ratings extends PostgresBaseRepository<IRating> implements IR_ratings {
  constructor() {
    super('ratings', 'rating_id');
  }

  async findByReviewId(reviewId: string): Promise<IRating | null> {
    const query = `SELECT * FROM ratings WHERE review_id = $1`;
    const { rows } = await prisma.query(query, [reviewId]);
    return rows[0] || null;
  }
}
