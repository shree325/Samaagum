import { Request, Response } from 'express';
import { CouponService } from '../services/CouponService';

const couponService = new CouponService();

export class CouponController {
  async create(req: Request, res: Response) {
    try {
      const coupon = await couponService.create(req.body);
      res.status(201).json(coupon);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async validate(req: Request, res: Response) {
    try {
      const { event_id, code } = req.body;
      if (!event_id || !code) return res.status(400).json({ error: 'event_id and code are required' });
      const coupon = await couponService.validate(event_id, code);
      res.json(coupon);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
  }

  async getByEvent(req: Request, res: Response) {
    try {
      const coupons = await couponService.getByEvent(req.params.eventId);
      res.json(coupons);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }
}
