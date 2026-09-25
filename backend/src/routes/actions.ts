import { Router } from 'express';
import { getActions, updateActionStatus, getActionHistory } from '../controllers/actionController.js';

const router = Router();

router.get('/', getActions);
router.get('/:id/history', getActionHistory);
router.patch('/:id', updateActionStatus);

export default router;

