import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new ProfileController();

router.get('/:userId', controller.getProfile.bind(controller));
router.patch('/:userId', authenticateUser, controller.updateProfile.bind(controller));

export default router;
