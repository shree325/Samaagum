import { IBaseRepository } from './IBaseRepository';

export interface IReview {
  review_id?: string;
  tenant_id: string;
  reviewer_user_id: string;
  target_entity_id: string;
  content?: any;
  status?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_reviews extends IBaseRepository<IReview> {
  findByTargetEntityId(targetEntityId: string): Promise<IReview[]>;
  findByReviewerUserId(reviewerUserId: string): Promise<IReview[]>;
}
