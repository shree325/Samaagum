export interface IAffiliate {
  id?: string;
  tenant_id: string;

  owner_user_id?: string | null;
  owner_entity_id?: string | null;

  referral_code: string;
  status?: string;

  payout_method?: string | null;
  payout_details?: Record<string, unknown> | null;

  joined_at?: Date;

  x_data?: Record<string, unknown> | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_affiliates {
  create(affiliate: IAffiliate): Promise<IAffiliate>;
  getById(id: string): Promise<IAffiliate | null>;
  getByReferralCode(tenantId: string, code: string): Promise<IAffiliate | null>;
  getByOwnerUserId(userId: string): Promise<IAffiliate[]>;
  getAll(): Promise<IAffiliate[]>;
  update(id: string, affiliate: Partial<IAffiliate>): Promise<IAffiliate | null>;
  delete(id: string): Promise<boolean>;
}
