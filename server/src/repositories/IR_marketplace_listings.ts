export interface IMarketplaceListing {
  row_id?: string;
  bu_id: string;
  par_row_id: string; // Seller Entity ID

  title: string;
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

export interface IR_marketplace_listings {
  create(listing: IMarketplaceListing): Promise<IMarketplaceListing>;
  getById(rowId: string): Promise<IMarketplaceListing | null>;
  getBySellerEntityId(sellerEntityId: string): Promise<IMarketplaceListing[]>;
  getAll(buId: string): Promise<IMarketplaceListing[]>;
  update(rowId: string, listing: Partial<IMarketplaceListing>): Promise<IMarketplaceListing | null>;
  delete(rowId: string): Promise<boolean>;
}
