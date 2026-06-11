export interface IApiKeys {
  row_id?: string;
  [key: string]: any;
}

export interface IR_api_keys {
  create(data: IApiKeys): Promise<IApiKeys>;
  getById(row_id: string): Promise<IApiKeys | null>;
  getAll(): Promise<IApiKeys[]>;
  update(row_id: string, data: Partial<IApiKeys>): Promise<IApiKeys | null>;
  delete(row_id: string): Promise<boolean>;
}
