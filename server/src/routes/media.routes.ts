import { Router } from 'express';
import { MediaController } from '../controllers/MediaController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new MediaController();

router.post('/assets', authenticateUser, controller.createAsset.bind(controller));
router.get('/assets/:id', controller.getAsset.bind(controller));
router.post('/galleries', authenticateUser, controller.createGallery.bind(controller));
router.get('/galleries/:id', controller.getGallery.bind(controller));
router.post('/galleries/:id/media', authenticateUser, controller.addToGallery.bind(controller));
router.get('/galleries/:id/media', controller.getGalleryMedia.bind(controller));

export default router;
