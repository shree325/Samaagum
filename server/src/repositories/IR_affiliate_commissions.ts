export interface IAffiliateCommissions {
  row_id?: string;
  [key: string]: any;
}

export interface IR_affiliate_commissions {
  create(data: IAffiliateCommissions): Promise<IAffiliateCommissions>;
  getById(row_id: string): Promise<IAffiliateCommissions | null>;
  getAll(): Promise<IAffiliateCommissions[]>;
  update(row_id: string, data: Partial<IAffiliateCommissions>): Promise<IAffiliateCommissions | null>;
  delete(row_id: string): Promise<boolean>;
}
