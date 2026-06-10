export interface ITicket {
  id?: string;
  tenant_id: string;

  booking_id: string;
  line_item_id: string;
  attendee_id?: string | null;

  attendee_name: string;
  attendee_email?: string | null;
  attendee_gender?: string | null;

  ticket_number: string;
  qr_token: string;

  status?: string;

  claimed_by_user_id?: string | null;
  issued_at?: Date;
  revoked_at?: Date | null;

  transferable?: boolean;
  seat_number?: string | null;

  modification_num?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_tickets {
  create(ticket: ITicket): Promise<ITicket>;
  getById(id: string): Promise<ITicket | null>;
  getByTicketNumber(tenantId: string, ticketNumber: string): Promise<ITicket | null>;
  getByQrToken(tenantId: string, qrToken: string): Promise<ITicket | null>;
  getByBookingId(bookingId: string): Promise<ITicket[]>;
  getByLineItemId(lineItemId: string): Promise<ITicket[]>;
  getByUserId(userId: string): Promise<ITicket[]>;
  getAll(): Promise<ITicket[]>;
  update(id: string, ticket: Partial<ITicket>): Promise<ITicket | null>;
  delete(id: string): Promise<boolean>;
}