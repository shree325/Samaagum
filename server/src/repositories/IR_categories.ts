export interface ICategory {
  row_id?: string;
  bu_id: string;
  par_row_id?: string | null;

  name: string;
  slug: string;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_categories {
  create(category: ICategory): Promise<ICategory>;
  getById(rowId: string): Promise<ICategory | null>;
  getBySlug(buId: string, slug: string): Promise<ICategory | null>;
  getByParentId(parentId: string): Promise<ICategory[]>;
  getAll(buId: string): Promise<ICategory[]>;
  update(rowId: string, category: Partial<ICategory>): Promise<ICategory | null>;
  delete(rowId: string): Promise<boolean>;
}
