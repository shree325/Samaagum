import { IBaseRepository } from './IBaseRepository';

export interface ICategory {
  category_id?: string;
  parent_id?: string | null;
  slug: string;
  name: string;
  status?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_categories extends IBaseRepository<ICategory> {
  findBySlug(slug: string): Promise<ICategory | null>;
  findByParentId(parentId: string): Promise<ICategory[]>;
}
