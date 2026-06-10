import { Request, Response } from 'express';
import { RBACService } from '../services/RBACService';
import { AuthenticatedRequest } from '../middlewares/auth';

const rbacService = new RBACService();

export class RBACController {

    async createRole(req: Request, res: Response) {
        try {
            const role = await rbacService.createRole(req.body);
            res.status(201).json(role);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async assignRole(req: AuthenticatedRequest, res: Response) {
        try {
            const grantedBy = req.user?.id;
            const { userId, roleId, scopeEntityId } = req.body;

            if (!userId || !roleId || !scopeEntityId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const assignment = await rbacService.assignRole(userId, roleId, scopeEntityId, grantedBy);
            res.status(201).json(assignment);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async removeRole(req: Request, res: Response) {
        try {
            const { userId, roleId, scopeEntityId } = req.body;

            if (!userId || !roleId || !scopeEntityId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const success = await rbacService.removeRole(userId, roleId, scopeEntityId);
            res.json({ success });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getUserRoles(req: Request, res: Response) {
        try {
            const roles = await rbacService.getUserRoles(req.params.userId);
            res.json(roles);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
