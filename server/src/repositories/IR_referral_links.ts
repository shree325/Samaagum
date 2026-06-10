export interface IReferralLink {
  id?: string;
  tenant_id: string;

  affiliate_id: string;

  code: string;
  destination_url: string;
  campaign_name?: string | null;

  clicked_count?: number;
  converted_count?: number;

  status?: string;
  expires_at?: Date | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_referral_links {
  create(link: IReferralLink): Promise<IReferralLink>;
  getById(id: string): Promise<IReferralLink | null>;
  getByCode(tenantId: string, code: string): Promise<IReferralLink | null>;
  getByAffiliateId(affiliateId: string): Promise<IReferralLink[]>;
  getAll(): Promise<IReferralLink[]>;
  update(id: string, link: Partial<IReferralLink>): Promise<IReferralLink | null>;
  delete(id: string): Promise<boolean>;
}
