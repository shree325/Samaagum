import { IBaseRepository } from './IBaseRepository';

export interface IRating {
  rating_id?: string;
  tenant_id: string;
  review_id: string;
  score: number;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_ratings extends IBaseRepository<IRating> {
  findByReviewId(reviewId: string): Promise<IRating | null>;
}
