import { IBaseRepository } from './IBaseRepository';

export interface IUserInterest {
  user_id: string;
  category_id: string;
  priority?: number;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_userInterests extends IBaseRepository<IUserInterest> {
  findByUserId(userId: string): Promise<IUserInterest[]>;
  findByCategoryId(categoryId: string): Promise<IUserInterest[]>;
}
