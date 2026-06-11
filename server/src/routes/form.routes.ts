import { Router } from 'express';
import { FormController } from '../controllers/FormController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();
const controller = new FormController();

router.post('/', authenticateUser, controller.createForm.bind(controller));
router.get('/:id', controller.getForm.bind(controller));
router.post('/:id/fields', authenticateUser, controller.addField.bind(controller));
router.get('/:id/fields', controller.getFields.bind(controller));
router.post('/:id/responses', controller.submitResponse.bind(controller));
router.get('/:id/responses', authenticateUser, controller.getResponses.bind(controller));

export default router;
