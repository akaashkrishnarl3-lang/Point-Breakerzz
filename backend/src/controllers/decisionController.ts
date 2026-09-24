import { Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getDecisions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const decisions = StorageService.getDecisions(userId);
    res.json({ success: true, data: decisions });
  } catch (err) {
    next(err);
  }
}
