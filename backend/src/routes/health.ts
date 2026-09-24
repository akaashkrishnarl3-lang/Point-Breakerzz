import { Router } from 'express';
import {
  healthCheck,
  resetDemo,
  clearAll,
  exportBackup,
  importBackup
} from '../controllers/systemController.js';

const router = Router();

router.get('/health', healthCheck);
router.post('/reset-demo', resetDemo);
router.post('/clear', clearAll);
router.get('/backup', exportBackup);
router.post('/backup', importBackup);

export default router;
