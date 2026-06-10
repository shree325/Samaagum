export interface IBundle {
  row_id?: string;
  bu_id: string;
  par_row_id: string; // Event ID

  name: string;
  description?: string | null;
  price_minor: number;
  currency: string;
  status?: string;
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

export interface IR_bundles {
  create(bundle: IBundle): Promise<IBundle>;
  getById(rowId: string): Promise<IBundle | null>;
  getByEventId(eventId: string): Promise<IBundle[]>;
  getAll(buId: string): Promise<IBundle[]>;
  update(rowId: string, bundle: Partial<IBundle>): Promise<IBundle | null>;
  delete(rowId: string): Promise<boolean>;
}
