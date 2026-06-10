export interface IApiClient {
  row_id?: string;
  bu_id: string;

  client_name: string;
  client_key: string;
  client_secret: string;
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

export interface IR_api_clients {
  create(client: IApiClient): Promise<IApiClient>;
  getById(rowId: string): Promise<IApiClient | null>;
  getByKey(clientKey: string): Promise<IApiClient | null>;
  getAll(buId: string): Promise<IApiClient[]>;
  update(rowId: string, client: Partial<IApiClient>): Promise<IApiClient | null>;
  delete(rowId: string): Promise<boolean>;
}
