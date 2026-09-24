import { Router } from 'express';
import { getActions, updateActionStatus } from '../controllers/actionController.js';

const router = Router();

router.get('/', getActions);
router.patch('/:id', updateActionStatus);

export default router;
