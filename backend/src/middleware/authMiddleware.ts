import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { dataStore } from '../models/dataStore.js';
import { User } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication token is missing.'
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication token is empty.'
    });
    return;
  }

  try {
    const payload = AuthService.verifySessionToken(token);
    const user = dataStore.findUserById(payload.id);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: User account not found.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Session is invalid or expired. Please sign in again.'
    });
  }
}
