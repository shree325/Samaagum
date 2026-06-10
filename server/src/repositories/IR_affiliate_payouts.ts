export interface IAffiliatePayout {
  row_id?: string;
  bu_id: string;
  par_row_id: string; // Affiliate ID

  amount_minor: number;
  currency: string;
  payout_method: string;
  payout_details?: Record<string, unknown> | null;
  status?: string;
  processed_at?: Date | null;
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

export interface IR_affiliate_payouts {
  create(payout: IAffiliatePayout): Promise<IAffiliatePayout>;
  getById(rowId: string): Promise<IAffiliatePayout | null>;
  getByAffiliateId(affiliateId: string): Promise<IAffiliatePayout[]>;
  getAll(buId: string): Promise<IAffiliatePayout[]>;
  update(rowId: string, payout: Partial<IAffiliatePayout>): Promise<IAffiliatePayout | null>;
  delete(rowId: string): Promise<boolean>;
}
