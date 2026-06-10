export interface ICommission {
  id?: string;
  tenant_id: string;

  affiliate_id: string;

  source_type: string;
  source_id: string;

  amount_minor: number;
  currency: string;

  state?: string;

  earned_at?: Date;
  approved_at?: Date | null;
  paid_at?: Date | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_commissions {
  create(commission: ICommission): Promise<ICommission>;
  getById(id: string): Promise<ICommission | null>;
  getByAffiliateId(affiliateId: string): Promise<ICommission[]>;
  getByState(state: string): Promise<ICommission[]>;
  getAll(): Promise<ICommission[]>;
  update(id: string, commission: Partial<ICommission>): Promise<ICommission | null>;
  delete(id: string): Promise<boolean>;
}
