import { Request, Response } from 'express';
import { MessagingService } from '../services/MessagingService';
import { AuthenticatedRequest } from '../middlewares/auth';

const messagingService = new MessagingService();

export class MessagingController {
  async createConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const conv = await messagingService.createConversation({
        ...req.body,
        created_by: req.user?.id || req.body.created_by,
      });
      res.status(201).json(conv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const msg = await messagingService.sendMessage({
        ...req.body,
        conversation_id: req.params.id,
        sender_user_id: req.user?.id || req.body.sender_user_id,
      });
      res.status(201).json(msg);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const convs = await messagingService.getConversations(userId);
      res.json(convs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const messages = await messagingService.getMessages(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
