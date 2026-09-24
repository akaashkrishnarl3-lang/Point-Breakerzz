import { Router } from 'express';
import { getUnresolved } from '../controllers/unresolvedController.js';

const router = Router();

router.get('/', getUnresolved);

export default router;
