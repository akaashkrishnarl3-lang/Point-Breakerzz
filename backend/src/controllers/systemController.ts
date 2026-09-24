import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { config } from '../utils/env.js';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  res.json({
    status: 'ok',
    service: 'MeetFlow AI Backend API',
    version: '1.0.0',
    geminiConfigured: Boolean(config.geminiApiKey && config.geminiApiKey.length > 10),
    timestamp: new Date().toISOString()
  });
}

export async function resetDemo(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    StorageService.resetToDemo();
    res.json({ success: true, message: 'Demo data successfully reset.' });
  } catch (err) {
    next(err);
  }
}

export async function clearAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    StorageService.clearAll();
    res.json({ success: true, message: 'All meeting records cleared.' });
  } catch (err) {
    next(err);
  }
}

export async function exportBackup(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const backup = StorageService.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=meetflow_backup_${Date.now()}.json`);
    res.send(backup);
  } catch (err) {
    next(err);
  }
}

export async function importBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body;
    const success = StorageService.importBackup(data);
    if (!success) {
      res.status(400).json({ success: false, error: 'Invalid backup format.' });
      return;
    }
    res.json({ success: true, message: 'Backup imported successfully.' });
  } catch (err) {
    next(err);
  }
}
