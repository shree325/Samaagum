export interface ITenant {
  row_id?: string;
  name: string;
  slug: string;
  status?: string;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_tenants {
  create(tenant: ITenant): Promise<ITenant>;
  getById(rowId: string): Promise<ITenant | null>;
  getBySlug(slug: string): Promise<ITenant | null>;
  getAll(): Promise<ITenant[]>;
  update(rowId: string, tenant: Partial<ITenant>): Promise<ITenant | null>;
  delete(rowId: string): Promise<boolean>;
}
