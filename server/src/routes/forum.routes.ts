import { Router } from 'express';
import { ForumController } from '../controllers/ForumController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new ForumController();

router.post('/posts', authenticateUser, controller.createPost.bind(controller));
router.get('/scope/:scopeId/posts', controller.getPosts.bind(controller));
router.get('/posts/:id', controller.getPost.bind(controller));
router.post('/posts/:id/comments', authenticateUser, controller.addComment.bind(controller));
router.get('/posts/:id/comments', controller.getComments.bind(controller));
router.post('/posts/:id/pin', authenticateUser, controller.pinPost.bind(controller));

export default router;
