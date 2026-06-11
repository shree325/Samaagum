import { Router } from 'express';
import { TenantController } from '../controllers/TenantController';
import { authenticateUser } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const controller = new TenantController();

router.post('/', authenticateUser, authorize('super_admin'), controller.create.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', authenticateUser, authorize('super_admin'), controller.update.bind(controller));

export default router;
