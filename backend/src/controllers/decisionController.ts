import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';

export async function getDecisions(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const decisions = StorageService.getDecisions();
    res.json({ success: true, data: decisions });
  } catch (err) {
    next(err);
  }
}
