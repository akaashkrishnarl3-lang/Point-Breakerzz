import { Request, Response, NextFunction } from 'express';
import { validateMeetingPayload, validateExtractionPayload } from '../utils/validators.js';

export function validateMeetingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const result = validateMeetingPayload(req.body);
  if (!result.valid) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  next();
}

export function validateExtractionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const result = validateExtractionPayload(req.body);
  if (!result.valid) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  next();
}
