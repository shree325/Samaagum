import pool from '../config/database';
import { R_bookings } from '../repositories/R_bookings';
import { R_tickets } from '../repositories/R_tickets';
import { IBooking } from '../repositories/IR_bookings';
import { ITicket } from '../repositories/IR_tickets';
import { randomBytes } from 'crypto';

export class BookingService {
  private bookingRepo: R_bookings;
  private ticketRepo: R_tickets;

  constructor() {
    this.bookingRepo = new R_bookings(pool);
    this.ticketRepo = new R_tickets(pool);
  }

  async createBooking(booking: Partial<IBooking>): Promise<IBooking> {
    if (!booking.tenant_id || !booking.event_id || !booking.booker_user_id) {
      throw new Error('tenant_id, event_id, and booker_user_id are required');
    }
    return this.bookingRepo.create(booking as IBooking);
  }

  async getById(id: string): Promise<IBooking | null> {
    return this.bookingRepo.getById(id);
  }

  async getByUser(userId: string): Promise<IBooking[]> {
    return this.bookingRepo.getByUserId(userId);
  }

  async getByEvent(eventId: string): Promise<IBooking[]> {
    return this.bookingRepo.getByEventId(eventId);
  }

  async confirmBooking(id: string): Promise<IBooking | null> {
    return this.bookingRepo.update(id, { status: 'confirmed' });
  }

  async cancelBooking(id: string): Promise<IBooking | null> {
    return this.bookingRepo.update(id, { status: 'cancelled' });
  }

  async update(id: string, updates: Partial<IBooking>): Promise<IBooking | null> {
    return this.bookingRepo.update(id, updates);
  }

  async getTicketsByBookingLineItem(lineItemId: string): Promise<ITicket[]> {
    return this.ticketRepo.getByLineItemId(lineItemId);
  }

  async generateQrToken(): string {
    return randomBytes(16).toString('hex');
  }
}
