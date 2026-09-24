import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { ActionItemStatus } from '../types/index.js';

export async function getActions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { meetingId, status, owner, search } = req.query;
    const actions = StorageService.getActionItems({
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

export async function updateActionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    const validStatuses: ActionItemStatus[] = ['NEW', 'CARRIED_OVER', 'COMPLETED', 'OVERDUE', 'AMBIGUOUS'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status: ${status}` });
      return;
    }

    const updated = StorageService.updateActionStatus(id, status);
    if (!updated) {
      res.status(404).json({ success: false, error: `Action item with ID ${id} not found.` });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
