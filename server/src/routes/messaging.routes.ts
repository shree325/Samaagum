import { Router } from 'express';
import { MessagingController } from '../controllers/MessagingController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new MessagingController();

router.post('/', authenticateUser, controller.createConversation.bind(controller));
router.get('/', authenticateUser, controller.getConversations.bind(controller));
router.post('/:id/messages', authenticateUser, controller.sendMessage.bind(controller));
router.get('/:id/messages', authenticateUser, controller.getMessages.bind(controller));

export default router;
