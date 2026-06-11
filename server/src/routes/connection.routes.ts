import { Router } from 'express';
import { ConnectionController } from '../controllers/ConnectionController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new ConnectionController();

router.post('/', authenticateUser, controller.sendRequest.bind(controller));
router.get('/', authenticateUser, controller.list.bind(controller));
router.post('/:id/accept', authenticateUser, controller.accept.bind(controller));
router.post('/:id/decline', authenticateUser, controller.decline.bind(controller));
router.post('/:id/block', authenticateUser, controller.block.bind(controller));

export default router;
