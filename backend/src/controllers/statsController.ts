import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';

export async function getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = StorageService.getSystemStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
