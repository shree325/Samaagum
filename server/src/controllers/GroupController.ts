import { Request, Response } from 'express';
import { GroupService } from '../services/GroupService';
import { AuthenticatedRequest } from '../middlewares/auth';

const groupService = new GroupService();

export class GroupController {

    async createGroup(req: Request, res: Response) {
        try {
            const group = await groupService.createGroup(req.body);
            res.status(201).json(group);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async joinGroup(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const membership = await groupService.joinGroup(req.params.id, userId, 'pending');
            res.status(201).json(membership);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async leaveGroup(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const success = await groupService.leaveGroup(req.params.id, userId);
            res.json({ success });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async approveMembership(req: Request, res: Response) {
        try {
            const { userId } = req.body;
            const membership = await groupService.approveMembership(req.params.id, userId);
            if (!membership) return res.status(404).json({ error: 'Membership not found' });
            res.json(membership);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async rejectMembership(req: Request, res: Response) {
        try {
            const { userId } = req.body;
            const membership = await groupService.rejectMembership(req.params.id, userId);
            if (!membership) return res.status(404).json({ error: 'Membership not found' });
            res.json(membership);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async listMembers(req: Request, res: Response) {
        try {
            const members = await groupService.listMembers(req.params.id);
            res.json(members);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
