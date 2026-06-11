import { Router } from 'express';
import { CheckinController } from '../controllers/CheckinController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new CheckinController();

router.post('/qr', authenticateUser, controller.checkinByQr.bind(controller));
router.post('/ticket/:ticketId', authenticateUser, controller.checkinByTicketId.bind(controller));
router.post('/ticket/:ticketId/reverse', authenticateUser, controller.reverse.bind(controller));
router.get('/ticket/:ticketId', authenticateUser, controller.getTicket.bind(controller));

export default router;
