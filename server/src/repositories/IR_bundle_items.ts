export interface IBundleItems {
  row_id?: string;
  [key: string]: any;
}

export interface IR_bundle_items {
  create(data: IBundleItems): Promise<IBundleItems>;
  getById(row_id: string): Promise<IBundleItems | null>;
  getAll(): Promise<IBundleItems[]>;
  update(row_id: string, data: Partial<IBundleItems>): Promise<IBundleItems | null>;
  delete(row_id: string): Promise<boolean>;
}
