import { Request, Response } from 'express';
import { CheckinService } from '../services/CheckinService';

const checkinService = new CheckinService();

export class CheckinController {
  async checkinByQr(req: Request, res: Response) {
    try {
      const { qr_token } = req.body;
      if (!qr_token) return res.status(400).json({ error: 'qr_token is required' });
      const ticket = await checkinService.checkinByQr(qr_token);
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async checkinByTicketId(req: Request, res: Response) {
    try {
      const ticket = await checkinService.checkinByTicketId(req.params.ticketId);
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async reverse(req: Request, res: Response) {
    try {
      const ticket = await checkinService.reverseCheckin(req.params.ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTicket(req: Request, res: Response) {
    try {
      const ticket = await checkinService.getTicket(req.params.ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
