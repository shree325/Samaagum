export interface ISponsorshipOrder {
  id?: string;
  tenant_id: string;

  package_id: string;
  sponsor_entity_id: string;

  status?: string;

  amount_minor: number;
  currency: string;

  creative_asset_id?: string | null;
  approved_by?: string | null;
  activated_at?: Date | null;
  expires_at?: Date | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_sponsorship_orders {
  create(order: ISponsorshipOrder): Promise<ISponsorshipOrder>;
  getById(id: string): Promise<ISponsorshipOrder | null>;
  getByPackageId(packageId: string): Promise<ISponsorshipOrder[]>;
  getBySponsorEntityId(sponsorEntityId: string): Promise<ISponsorshipOrder[]>;
  getAll(): Promise<ISponsorshipOrder[]>;
  update(id: string, order: Partial<ISponsorshipOrder>): Promise<ISponsorshipOrder | null>;
  delete(id: string): Promise<boolean>;
}
