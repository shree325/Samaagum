import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthenticatedRequest } from '../middlewares/auth';

const userService = new UserService();

export class UserController {

  async register(req: Request, res: Response) {
    try {
      const { tenant_id, email, provider } = req.body;
      if (!tenant_id || !email) {
        return res.status(400).json({ error: 'tenant_id and email are required' });
      }
      const user = await userService.register(tenant_id, email, provider || 'email');
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const user = await userService.getById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async activateUser(req: Request, res: Response) {
    try {
      const user = await userService.activateUser(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deactivateUser(req: Request, res: Response) {
    try {
      const user = await userService.deactivateUser(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async completeProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params.id;
      const { display_name, bio } = req.body;
      if (!display_name) {
        return res.status(400).json({ error: 'display_name is required' });
      }
      const user = await userService.completeProfile(userId, { display_name, bio });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async listByTenant(req: Request, res: Response) {
    try {
      const users = await userService.getByTenant(req.params.tenantId);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
