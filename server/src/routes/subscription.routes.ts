import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new SubscriptionController();

router.post('/', authenticateUser, controller.subscribe.bind(controller));
router.get('/entity/:entityId', authenticateUser, controller.getByEntity.bind(controller));
router.post('/:id/cancel', authenticateUser, controller.cancel.bind(controller));
router.get('/plans', controller.getPlans.bind(controller));
router.post('/plans', authenticateUser, controller.createPlan.bind(controller));

export default router;
