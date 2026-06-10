import { Router } from 'express';
import { EntityController } from '../controllers/EntityController';
import { authenticateUser } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const controller = new EntityController();

router.post('/', authenticateUser, authorize('org_admin'), controller.createEntity.bind(controller));
router.get('/:id', controller.getEntity.bind(controller));
router.patch('/:id', authenticateUser, authorize('org_admin'), controller.updateEntity.bind(controller));
router.delete('/:id', authenticateUser, authorize('super_admin'), controller.deleteEntity.bind(controller));

export default router;
