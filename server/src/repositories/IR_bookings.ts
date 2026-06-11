import { IBaseRepository } from "./IBaseRepository";

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

export interface IR_bookings extends IBaseRepository<IBooking> {
  findByUserId(userId: string): Promise<IBooking[]>;
  findByEventId(eventId: string): Promise<IBooking[]>;
  findByReference(bookingReference: string): Promise<IBooking | null>;
  findByTenant(tenantId: string): Promise<IBooking[]>;
}