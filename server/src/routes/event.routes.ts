import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new EventController();

router.post('/', authenticateUser, controller.create.bind(controller));
router.get('/published/:tenantId', controller.getPublished.bind(controller));
router.get('/entity/:entityId', controller.getByHostEntity.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', authenticateUser, controller.update.bind(controller));
router.post('/:id/publish', authenticateUser, controller.publish.bind(controller));
router.post('/:id/cancel', authenticateUser, controller.cancel.bind(controller));
router.delete('/:id', authenticateUser, controller.deleteEvent.bind(controller));

export default router;
