import { IBaseRepository } from './IBaseRepository';

export interface ITag {
  id?: string;
  category_id: string;
  slug: string;
  name: string;
  status?: string;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_tags extends IBaseRepository<ITag> {
  findBySlug(slug: string): Promise<ITag | null>;
  findByCategory(categoryId: string): Promise<ITag[]>;
}
