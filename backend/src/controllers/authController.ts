import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { dataStore } from '../models/dataStore.js';
import { User } from '../types/index.js';
import { logger } from '../utils/logger.js';

export function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        error: 'Please enter your full name.'
      });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = dataStore.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in.'
      });
      return;
    }

    const hashedPassword = AuthService.hashPassword(password);
    const user = dataStore.createUser({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      provider: 'email'
    });

    const token = AuthService.createSessionToken(user);

    logger.info(`New user created via registration: ${user.email} (${user.id})`);

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (err: any) {
    logger.error('Registration Error:', err.message || err);
    res.status(500).json({
      success: false,
      error: 'Failed to create account. Please try again.'
    });
  }
}

export async function googleAuth(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const idToken = req.body.credential || req.body.idToken || req.body.token;

    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Authentication token is missing from request body.'
      });
      return;
    }

    const { user, token } = await AuthService.authenticateUserWithToken(idToken);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (err: any) {
    logger.error('Authentication Error:', err.message || err);
    res.status(401).json({
      success: false,
      error: 'Google sign-in failed. Please verify credentials and try again.'
    });
  }
}

export async function emailPasswordLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = dataStore.findUserByEmail(cleanEmail);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please check your credentials or create an account.'
      });
      return;
    }

    if (user.provider === 'google' && !user.password) {
      res.status(400).json({
        success: false,
        error: 'This account was registered using Google. Please sign in using "Continue with Google".'
      });
      return;
    }

    if (!user.password || !AuthService.verifyPassword(String(password), user.password)) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
      return;
    }

    const updatedUser = dataStore.updateUserLogin(user.id) || user;
    const token = AuthService.createSessionToken(updatedUser);

    logger.info(`User logged in via email: ${updatedUser.email} (${updatedUser.id})`);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(updatedUser),
        token
      }
    });
  } catch (err: any) {
    logger.error('Email Login Error:', err.message || err);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthenticated.'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function demoLogin(_req: Request, res: Response): Promise<void> {
  try {
    const demoUser = dataStore.ensureDemoUser();
    const token = AuthService.createSessionToken(demoUser);

    logger.info(`Demo User logged in: ${demoUser.email} (${demoUser.id})`);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(demoUser),
        token
      }
    });
  } catch (err: any) {
    logger.error('Demo Login Error:', err.message || err);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize demo session. Please try again.'
    });
  }
}

export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}

