import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { RBACService } from '../services/RBACService';

const rbacService = new RBACService();

export const authorize = (roleKey: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: User not found in request' });
            }

            const scopeEntityId = req.params.id || req.body.entity_id || req.body.scope_entity_id || req.query.entityId;

            if (!scopeEntityId) {
                return res.status(400).json({ error: 'Bad Request: Missing scope entity ID to authorize against' });
            }

            const hasAccess = await rbacService.hasPermission(userId, roleKey, scopeEntityId as string);

            if (!hasAccess) {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ error: 'Internal Server Error during authorization' });
        }
    };
};
