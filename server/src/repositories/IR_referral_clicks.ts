export interface IReferralClick {
  row_id?: string;
  bu_id: string;
  par_row_id: string; // Referral Link ID

  ip_address?: string | null;
  user_agent?: string | null;
  device_type?: string | null;
  clicked_at?: Date;

  created?: Date;
  created_by?: string | null;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_referral_clicks {
  create(click: IReferralClick): Promise<IReferralClick>;
  getById(rowId: string): Promise<IReferralClick | null>;
  getByReferralLinkId(referralLinkId: string): Promise<IReferralClick[]>;
  getAll(buId: string): Promise<IReferralClick[]>;
  delete(rowId: string): Promise<boolean>;
}
