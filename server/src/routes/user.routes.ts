import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new UserController();

router.post('/', controller.register.bind(controller));
router.get('/tenant/:tenantId', controller.listByTenant.bind(controller));
router.get('/:id', controller.getUser.bind(controller));
router.patch('/:id', authenticateUser, controller.updateUser.bind(controller));
router.post('/:id/activate', authenticateUser, controller.activateUser.bind(controller));
router.post('/:id/deactivate', authenticateUser, controller.deactivateUser.bind(controller));
router.post('/:id/complete-profile', authenticateUser, controller.completeProfile.bind(controller));

export default router;
