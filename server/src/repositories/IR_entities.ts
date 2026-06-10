export interface IEntity {
  row_id?: string;
  bu_id: string;
  entity_type: string;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_entities {
  create(entity: IEntity): Promise<IEntity>;
  getById(rowId: string): Promise<IEntity | null>;
  getByType(buId: string, entityType: string): Promise<IEntity[]>;
  getAll(buId: string): Promise<IEntity[]>;
  update(rowId: string, entity: Partial<IEntity>): Promise<IEntity | null>;
  delete(rowId: string): Promise<boolean>;
}
