export interface ITicketType {
  id?: string;
  tenant_id: string;

  event_id: string;

  name: string;
  description?: string | null;

  price_minor: number;
  currency: string;

  capacity?: number | null;
  quantity_sold?: number;
  max_per_booking?: number | null;

  sale_start_at?: Date | null;
  sale_end_at?: Date | null;

  early_bird_price_minor?: number | null;
  early_bird_ends_at?: Date | null;

  visibility?: string;
  sort_order?: number;
  is_active?: boolean;
  status?: string;

  membership_tier_id?: string | null;
  eligibility?: Record<string, unknown> | null;
  modification_num?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_ticket_types {
  create(ticketType: ITicketType): Promise<ITicketType>;
  getById(id: string): Promise<ITicketType | null>;
  getByEventId(eventId: string): Promise<ITicketType[]>;
  getAll(): Promise<ITicketType[]>;
  update(id: string, ticketType: Partial<ITicketType>): Promise<ITicketType | null>;
  delete(id: string): Promise<boolean>;
}