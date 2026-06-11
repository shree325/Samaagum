export interface IMarketplaceBids {
  row_id?: string;
  [key: string]: any;
}

export interface IR_marketplace_bids {
  create(data: IMarketplaceBids): Promise<IMarketplaceBids>;
  getById(row_id: string): Promise<IMarketplaceBids | null>;
  getAll(): Promise<IMarketplaceBids[]>;
  update(row_id: string, data: Partial<IMarketplaceBids>): Promise<IMarketplaceBids | null>;
  delete(row_id: string): Promise<boolean>;
}
