import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new BookingController();

router.post('/', authenticateUser, controller.create.bind(controller));
router.get('/user/:userId', authenticateUser, controller.getByUser.bind(controller));
router.get('/event/:eventId', authenticateUser, controller.getByEvent.bind(controller));
router.get('/:id', authenticateUser, controller.getById.bind(controller));
router.post('/:id/confirm', authenticateUser, controller.confirm.bind(controller));
router.post('/:id/cancel', authenticateUser, controller.cancel.bind(controller));

export default router;
