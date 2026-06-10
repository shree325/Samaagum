export interface ITicketClaim {
  id?: string;
  tenant_id: string;

  ticket_id: string;

  token: string;
  expires_at: Date;

  claimed_at?: Date | null;
  claimed_user_id?: string | null;
  otp_verified_at?: Date | null;

  attempt_count?: number;
  status?: string;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_ticket_claims {
  create(claim: ITicketClaim): Promise<ITicketClaim>;
  getById(id: string): Promise<ITicketClaim | null>;
  getByToken(tenantId: string, token: string): Promise<ITicketClaim | null>;
  getByTicketId(ticketId: string): Promise<ITicketClaim[]>;
  getAll(): Promise<ITicketClaim[]>;
  update(id: string, claim: Partial<ITicketClaim>): Promise<ITicketClaim | null>;
  delete(id: string): Promise<boolean>;
}
