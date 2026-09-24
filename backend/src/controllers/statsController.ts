import { Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const stats = StorageService.getSystemStats(userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
