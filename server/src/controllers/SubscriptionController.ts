import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';

const subService = new SubscriptionService();

export class SubscriptionController {
  async subscribe(req: Request, res: Response) {
    try {
      const sub = await subService.subscribe(req.body);
      res.status(201).json(sub);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async cancel(req: Request, res: Response) {
    try {
      const sub = await subService.cancel(req.params.id);
      if (!sub) return res.status(404).json({ error: 'Subscription not found' });
      res.json(sub);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getByEntity(req: Request, res: Response) {
    try {
      const subs = await subService.getByEntity(req.params.entityId);
      res.json(subs);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getPlans(req: Request, res: Response) {
    try {
      const plans = await subService.getPlans();
      res.json(plans);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async createPlan(req: Request, res: Response) {
    try {
      const plan = await subService.createPlan(req.body);
      res.status(201).json(plan);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }
}
