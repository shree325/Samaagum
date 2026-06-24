import { IBaseRepository } from './IBaseRepository';

export interface ICategory {
  id?: string;
  parent_id?: string | null;
  slug: string;
  name: string;
  description?: string | null;
  icon_type?: string;
  icon_value?: string | null;
  display_order?: number;
  status?: string;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_categories extends IBaseRepository<ICategory> {
  findBySlug(slug: string): Promise<ICategory | null>;
  findByParentId(parentId: string): Promise<ICategory[]>;
}
