import { Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getUnresolved(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const unresolved = StorageService.getUnresolvedIssues(userId);
    res.json({ success: true, data: unresolved });
  } catch (err) {
    next(err);
  }
}
