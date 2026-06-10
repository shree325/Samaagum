import { Router } from 'express';
import { RBACController } from '../controllers/RBACController';
import { authenticateUser } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const controller = new RBACController();

router.post('/roles', authenticateUser, authorize('super_admin'), controller.createRole.bind(controller));
router.post('/roles/assign', authenticateUser, authorize('org_admin'), controller.assignRole.bind(controller));
router.delete('/roles/remove', authenticateUser, authorize('org_admin'), controller.removeRole.bind(controller));
router.get('/roles/user/:userId', authenticateUser, controller.getUserRoles.bind(controller));

export default router;
