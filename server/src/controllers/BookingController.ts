import { Request, Response } from 'express';
import { BookingService } from '../services/BookingService';
import { AuthenticatedRequest } from '../middlewares/auth';

const bookingService = new BookingService();

export class BookingController {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const booking = await bookingService.createBooking({
        ...req.body,
        booker_user_id: req.user?.id || req.body.booker_user_id,
      });
      res.status(201).json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const booking = await bookingService.getById(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByUser(req: Request, res: Response) {
    try {
      const bookings = await bookingService.getByUser(req.params.userId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByEvent(req: Request, res: Response) {
    try {
      const bookings = await bookingService.getByEvent(req.params.eventId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async confirm(req: Request, res: Response) {
    try {
      const booking = await bookingService.confirmBooking(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const booking = await bookingService.cancelBooking(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
