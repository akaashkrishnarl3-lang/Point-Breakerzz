import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { config } from '../utils/env.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  res.json({
    status: 'ok',
    service: 'MeetFlow AI Backend API',
    version: '1.0.0',
    firebaseConfigured: Boolean(config.firebaseProjectId && config.firebaseProjectId.length > 3),
    geminiConfigured: Boolean(config.geminiApiKey && config.geminiApiKey.length > 10),
    timestamp: new Date().toISOString()
  });
}

export async function loadDemo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = StorageService.loadDemoData(userId);
    res.json({
      success: true,
      message: result.alreadyLoaded ? 'Demo data is already loaded.' : 'Demo data loaded successfully',
      alreadyLoaded: result.alreadyLoaded,
      data: result.stats
    });
  } catch (err) {
    next(err);
  }
}

export async function resetDemo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    StorageService.resetToDemo(userId);
    res.json({ success: true, message: 'Demo data successfully reset for your account.' });
  } catch (err) {
    next(err);
  }
}

export async function clearAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    StorageService.clearAll(userId);
    res.json({ success: true, message: 'All your meeting records have been cleared.' });
  } catch (err) {
    next(err);
  }
}

export async function exportBackup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const backup = StorageService.exportBackup(userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=meetflow_backup_${Date.now()}.json`);
    res.send(backup);
  } catch (err) {
    next(err);
  }
}

export async function importBackup(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const data = req.body;
    const success = StorageService.importBackup(userId, data);
    if (!success) {
      res.status(400).json({ success: false, error: 'Invalid backup format.' });
      return;
    }
    res.json({ success: true, message: 'Backup imported successfully.' });
  } catch (err) {
    next(err);
  }
}
