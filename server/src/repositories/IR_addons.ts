export interface IAddon {
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

export interface IR_addons {
  create(addon: IAddon): Promise<IAddon>;
  getById(rowId: string): Promise<IAddon | null>;
  getByEventId(eventId: string): Promise<IAddon[]>;
  getAll(buId: string): Promise<IAddon[]>;
  update(rowId: string, addon: Partial<IAddon>): Promise<IAddon | null>;
  delete(rowId: string): Promise<boolean>;
}
