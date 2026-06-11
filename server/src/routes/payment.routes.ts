import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new PaymentController();

router.post('/', authenticateUser, controller.initiate.bind(controller));
router.post('/webhook', controller.webhook.bind(controller));
router.get('/booking/:bookingId', authenticateUser, controller.getByBooking.bind(controller));
router.get('/:id', authenticateUser, controller.getById.bind(controller));

export default router;
