import { Request, Response } from 'express';
import { ConnectionService } from '../services/ConnectionService';
import { AuthenticatedRequest } from '../middlewares/auth';

const connectionService = new ConnectionService();

export class ConnectionController {
  async sendRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const conn = await connectionService.sendRequest({
        ...req.body,
        requester_user_id: req.user?.id || req.body.requester_user_id,
      });
      res.status(201).json(conn);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async accept(req: Request, res: Response) {
    try {
      const conn = await connectionService.accept(req.params.id);
      if (!conn) return res.status(404).json({ error: 'Connection not found' });
      res.json(conn);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async decline(req: Request, res: Response) {
    try {
      const conn = await connectionService.decline(req.params.id);
      if (!conn) return res.status(404).json({ error: 'Connection not found' });
      res.json(conn);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async block(req: Request, res: Response) {
    try {
      const conn = await connectionService.block(req.params.id);
      if (!conn) return res.status(404).json({ error: 'Connection not found' });
      res.json(conn);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const connections = await connectionService.getConnections(userId);
      res.json(connections);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }
}
