export interface IBooking {
  id?: string;
  tenant_id: string;
  event_id: string;
  booker_user_id: string;
  status?: string;
  payment_method?: string;
  hold_expires_at?: Date | null;
  total_amount_minor?: number | null;
  total_currency?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_bookings {
  create(booking: IBooking): Promise<IBooking>;
  getById(id: string): Promise<IBooking | null>;
  getByUserId(userId: string): Promise<IBooking[]>;
  getByEventId(eventId: string): Promise<IBooking[]>;
  getByStatus(eventId: string, status: string): Promise<IBooking[]>;
  update(id: string, booking: Partial<IBooking>): Promise<IBooking | null>;
  delete(id: string): Promise<boolean>;
}