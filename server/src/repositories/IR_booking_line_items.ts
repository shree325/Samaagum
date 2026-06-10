export interface IBookingLineItem {
  id?: string;
  tenant_id: string;

  booking_id: string;
  ticket_type_id: string;

  quantity: number;

  unit_price_minor: number;
  currency: string;
  discount_minor?: number;
  tax_minor?: number;
  total_minor: number;

  line_status?: string;
  attendee_capture_mode?: string;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_booking_line_items {
  create(item: IBookingLineItem): Promise<IBookingLineItem>;
  getById(id: string): Promise<IBookingLineItem | null>;
  getByBookingId(bookingId: string): Promise<IBookingLineItem[]>;
  getAll(): Promise<IBookingLineItem[]>;
  update(id: string, item: Partial<IBookingLineItem>): Promise<IBookingLineItem | null>;
  delete(id: string): Promise<boolean>;
}