export interface IPlatformSettings {
  row_id?: string;
  [key: string]: any;
}

export interface IR_platform_settings {
  create(data: IPlatformSettings): Promise<IPlatformSettings>;
  getById(row_id: string): Promise<IPlatformSettings | null>;
  getAll(): Promise<IPlatformSettings[]>;
  update(row_id: string, data: Partial<IPlatformSettings>): Promise<IPlatformSettings | null>;
  delete(row_id: string): Promise<boolean>;
}
