export interface ISponsor {
  row_id?: string;
  bu_id: string;

  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  contact_email?: string | null;
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

export interface IR_sponsors {
  create(sponsor: ISponsor): Promise<ISponsor>;
  getById(rowId: string): Promise<ISponsor | null>;
  getAll(buId: string): Promise<ISponsor[]>;
  update(rowId: string, sponsor: Partial<ISponsor>): Promise<ISponsor | null>;
  delete(rowId: string): Promise<boolean>;
}
