import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';

export async function getUnresolved(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const unresolved = StorageService.getUnresolvedIssues();
    res.json({ success: true, data: unresolved });
  } catch (err) {
    next(err);
  }
}
