export interface ISignal {
  row_id?: string;
  bu_id: string;
  entity_type: string;
  entity_id: string;
  signal_type: string;
  signal_value: number;

  created?: Date;
  created_by?: string | null;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_signals {
  create(signal: ISignal): Promise<ISignal>;
  getById(rowId: string): Promise<ISignal | null>;
  getByEntity(entityType: string, entityId: string): Promise<ISignal[]>;
  getAll(buId: string): Promise<ISignal[]>;
  delete(rowId: string): Promise<boolean>;
}
