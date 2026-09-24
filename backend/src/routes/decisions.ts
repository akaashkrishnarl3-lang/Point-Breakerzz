import { Router } from 'express';
import { getDecisions } from '../controllers/decisionController.js';

const router = Router();

router.get('/', getDecisions);

export default router;
