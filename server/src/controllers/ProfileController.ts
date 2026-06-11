import { Request, Response } from 'express';
import { ProfileService } from '../services/ProfileService';

const profileService = new ProfileService();

export class ProfileController {
  async getProfile(req: Request, res: Response) {
    try {
      const profile = await profileService.getByUserId(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const profile = await profileService.update(req.params.userId, req.body);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
