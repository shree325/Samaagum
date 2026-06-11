import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';

const paymentService = new PaymentService();

export class PaymentController {
  async initiate(req: Request, res: Response) {
    try {
      const payment = await paymentService.initiate(req.body);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const payment = await paymentService.getById(req.params.id);
      if (!payment) return res.status(404).json({ error: 'Payment not found' });
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByBooking(req: Request, res: Response) {
    try {
      const payments = await paymentService.getByBooking(req.params.bookingId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async webhook(req: Request, res: Response) {
    try {
      const { gateway_payment_id, status } = req.body;
      if (!gateway_payment_id || !status) {
        return res.status(400).json({ error: 'gateway_payment_id and status are required' });
      }
      const payment = await paymentService.captureCallback(gateway_payment_id, status);
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
