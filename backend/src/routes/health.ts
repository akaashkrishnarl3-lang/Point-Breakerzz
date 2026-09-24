import { Router } from 'express';
import {
  healthCheck,
  loadDemo,
  resetDemo,
  clearAll,
  exportBackup,
  importBackup
} from '../controllers/systemController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Public health check
router.get('/health', healthCheck);

// Protected system actions
router.post('/demo/load', authMiddleware, loadDemo);
router.post('/demo/reset', authMiddleware, resetDemo);
router.post('/reset-demo', authMiddleware, resetDemo);
router.post('/clear', authMiddleware, clearAll);
router.get('/backup', authMiddleware, exportBackup);
router.post('/backup', authMiddleware, importBackup);

export default router;
