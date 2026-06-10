export interface IGroup {
  row_id?: string;
  bu_id: string;
  entity_id: string;
  par_row_id?: string | null;

  name: string;
  description?: string | null;
  status?: string;
  pr_dept_ou_id?: string | null;
  x_data?: Record<string, unknown> | null;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_groups {
  create(group: IGroup): Promise<IGroup>;
  getById(rowId: string): Promise<IGroup | null>;
  getByEntityId(entityId: string): Promise<IGroup | null>;
  getByParentRowId(parRowId: string): Promise<IGroup[]>;
  getAll(buId: string): Promise<IGroup[]>;
  update(rowId: string, group: Partial<IGroup>): Promise<IGroup | null>;
  delete(rowId: string): Promise<boolean>;
}
