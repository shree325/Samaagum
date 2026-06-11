import { Request, Response } from 'express';
import { TenantService } from '../services/TenantService';

const tenantService = new TenantService();

export class TenantController {
  async create(req: Request, res: Response) {
    try {
      const tenant = await tenantService.create(req.body);
      res.status(201).json(tenant);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const tenant = await tenantService.getById(req.params.id);
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
      res.json(tenant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const tenants = await tenantService.getAll();
      res.json(tenants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const tenant = await tenantService.update(req.params.id, req.body);
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
      res.json(tenant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
