export interface IDisputes {
  row_id?: string;
  [key: string]: any;
}

export interface IR_disputes {
  create(data: IDisputes): Promise<IDisputes>;
  getById(row_id: string): Promise<IDisputes | null>;
  getAll(): Promise<IDisputes[]>;
  update(row_id: string, data: Partial<IDisputes>): Promise<IDisputes | null>;
  delete(row_id: string): Promise<boolean>;
}
