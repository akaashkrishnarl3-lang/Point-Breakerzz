import { Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { ActionItemStatus } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getActions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { meetingId, status, owner, search } = req.query;
    const actions = StorageService.getActionItems(userId, {
      meetingId: meetingId as string | undefined,
      status: status as string | undefined,
      owner: owner as string | undefined,
      search: search as string | undefined
    });
    res.json({ success: true, data: actions });
  } catch (err) {
    next(err);
  }
}

export async function updateActionStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    let { status } = req.body;

    // Normalize potential status aliases
    if (status === 'CARRIED-OVER') status = 'CARRIED_OVER';

    const validStatuses: ActionItemStatus[] = ['NEW', 'IN_PROGRESS', 'CARRIED_OVER', 'COMPLETED', 'OVERDUE', 'AMBIGUOUS'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const updated = StorageService.updateActionStatus(userId, id, status);
    if (!updated) {
      res.status(404).json({ success: false, error: `Action item with ID ${id} not found.` });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function getActionHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const historyData = StorageService.getActionHistory(userId, id);
    if (!historyData) {
      res.status(404).json({ success: false, error: `Action item with ID ${id} not found.` });
      return;
    }
    res.json({ success: true, data: historyData });
  } catch (err) {
    next(err);
  }
}

