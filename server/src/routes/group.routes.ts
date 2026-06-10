import { Router } from 'express';
import { GroupController } from '../controllers/GroupController';
import { authenticateUser } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const controller = new GroupController();

router.post('/', authenticateUser, controller.createGroup.bind(controller));
router.post('/:id/join', authenticateUser, controller.joinGroup.bind(controller));
router.post('/:id/leave', authenticateUser, controller.leaveGroup.bind(controller));
router.post('/:id/approve', authenticateUser, authorize('group_admin'), controller.approveMembership.bind(controller));
router.post('/:id/reject', authenticateUser, authorize('group_admin'), controller.rejectMembership.bind(controller));
router.get('/:id/members', controller.listMembers.bind(controller));

export default router;
