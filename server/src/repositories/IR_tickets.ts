export interface ITicket {
  id?: string;
  tenant_id: string;
  line_item_id: string;
  attendee_name?: string | null;
  attendee_email?: string | null;
  attendee_gender?: string | null;
  qr_token: string;
  status?: string;
  claimed_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_tickets {
  create(ticket: ITicket): Promise<ITicket>;
  getById(id: string): Promise<ITicket | null>;
  getByQrToken(qrToken: string): Promise<ITicket | null>;
  getByLineItemId(lineItemId: string): Promise<ITicket[]>;
  getByUserId(userId: string): Promise<ITicket[]>;
  getAll(): Promise<ITicket[]>;
  update(id: string, ticket: Partial<ITicket>): Promise<ITicket | null>;
  delete(id: string): Promise<boolean>;
}