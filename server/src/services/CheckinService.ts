import pool from '../config/database';
import { R_tickets } from '../repositories/R_tickets';
import { ITicket } from '../repositories/IR_tickets';

export class CheckinService {
  private ticketRepo: R_tickets;

  constructor() {
    this.ticketRepo = new R_tickets(pool);
  }

  async checkinByQr(qrToken: string): Promise<ITicket | null> {
    const ticket = await this.ticketRepo.getByQrToken(qrToken);
    if (!ticket) throw new Error('Ticket not found for QR token');
    if (ticket.status === 'checked_in') throw new Error('Ticket already checked in');
    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      throw new Error('Ticket is cancelled or refunded');
    }
    return this.ticketRepo.update(ticket.id!, { status: 'checked_in' });
  }

  async checkinByTicketId(ticketId: string): Promise<ITicket | null> {
    const ticket = await this.ticketRepo.getById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status === 'checked_in') throw new Error('Ticket already checked in');
    return this.ticketRepo.update(ticketId, { status: 'checked_in' });
  }

  async reverseCheckin(ticketId: string): Promise<ITicket | null> {
    return this.ticketRepo.update(ticketId, { status: 'confirmed' });
  }

  async getTicket(id: string): Promise<ITicket | null> {
    return this.ticketRepo.getById(id);
  }
}
