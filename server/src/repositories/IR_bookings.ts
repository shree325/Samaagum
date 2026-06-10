export interface IBooking {
  id?: string;
  tenant_id: string;

  event_id: string;
  booker_user_id: string;

  booking_reference: string;

  status?: string;
  payment_method?: string | null;
  hold_expires_at?: Date | null;

  subtotal_minor: number;
  discount_minor?: number;
  tax_minor?: number;
  total_minor: number;
  currency: string;

  total_tickets?: number;
  source_channel?: string | null;
  notes?: string | null;

  x_data?: Record<string, unknown> | null;
  modification_num?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_bookings {
  create(booking: IBooking): Promise<IBooking>;
  getById(id: string): Promise<IBooking | null>;
  getByReference(tenantId: string, ref: string): Promise<IBooking | null>;
  getByUserId(userId: string): Promise<IBooking[]>;
  getByEventId(eventId: string): Promise<IBooking[]>;
  getAll(): Promise<IBooking[]>;
  update(id: string, booking: Partial<IBooking>): Promise<IBooking | null>;
  delete(id: string): Promise<boolean>;
}