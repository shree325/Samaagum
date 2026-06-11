import { Router } from 'express';
import { CouponController } from '../controllers/CouponController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new CouponController();

router.post('/', authenticateUser, controller.create.bind(controller));
router.post('/validate', controller.validate.bind(controller));
router.get('/event/:eventId', authenticateUser, controller.getByEvent.bind(controller));

export default router;
