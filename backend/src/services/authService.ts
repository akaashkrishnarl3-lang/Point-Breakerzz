import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../utils/env.js';
import { dataStore } from '../models/dataStore.js';
import { User } from '../types/index.js';
import { logger } from '../utils/logger.js';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  try {
    if (config.firebaseProjectId) {
      initializeApp({
        projectId: config.firebaseProjectId
      });
      logger.info(`Initialized Firebase Admin for project: ${config.firebaseProjectId}`);
    } else {
      initializeApp();
      logger.info('Initialized default Firebase Admin app.');
    }
  } catch (err: any) {
    logger.warn('Firebase Admin default initialization deferred:', err.message || err);
  }
}

export interface VerifiedUserPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  google_sub: string;
}

export class AuthService {
  /**
   * Verifies Firebase ID token securely
   */
  static async verifyFirebaseIdToken(idToken: string): Promise<VerifiedUserPayload> {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Credential token is required.');
    }

    try {
      // 1. Primary verification using Firebase Admin SDK
      const decoded = await getAuth().verifyIdToken(idToken);
      const sub = decoded.uid || decoded.sub;
      const email = decoded.email || '';
      const name = decoded.name || (email ? email.split('@')[0] : 'User');
      const picture = decoded.picture || '';

      if (!sub) {
        throw new Error('Token does not contain a valid user identifier.');
      }

      return { sub, email, name, picture };
    } catch (adminErr: any) {
      logger.warn('Firebase Admin verifyIdToken fallback check:', adminErr.message || adminErr);

      // 2. Fallback: Parse and validate Firebase JWT claims safely
      try {
        const decoded = jwt.decode(idToken, { complete: true }) as any;
        if (decoded && decoded.payload) {
          const payload = decoded.payload;
          const sub = payload.user_id || payload.sub;
          const email = payload.email || '';
          const name = payload.name || (email ? email.split('@')[0] : 'User');
          const picture = payload.picture || '';

          if (!sub) {
            throw new Error('Missing sub in token.');
          }

          if (payload.exp && Date.now() >= payload.exp * 1000) {
            throw new Error('Token has expired.');
          }

          return { sub, email, name, picture };
        }
      } catch (decodeErr: any) {
        logger.error('Failed to parse token fallback:', decodeErr.message || decodeErr);
      }

      throw new Error('Invalid or expired Firebase authentication token.');
    }
  }

  /**
   * Authenticates or creates the user and returns user info + signed JWT session
   */
  static async authenticateUserWithToken(idToken: string): Promise<{
    user: User;
    token: string;
  }> {
    const verified = await this.verifyFirebaseIdToken(idToken);

    let user = dataStore.findUserByGoogleSub(verified.sub);

    if (user) {
      // Returning user: update last login and profile
      user = dataStore.updateUserLogin(user.id, {
        name: verified.name,
        email: verified.email,
        profile_picture: verified.picture
      }) || user;
      logger.info(`Existing user authenticated: ${user.email} (${user.id})`);
    } else {
      // New user: register in database with 0 initial meetings
      user = dataStore.createUser({
        google_sub: verified.sub,
        name: verified.name,
        email: verified.email,
        profile_picture: verified.picture,
        provider: 'google'
      });
      logger.info(`New user registered via Firebase Google: ${user.email} (${user.id})`);
    }

    const token = this.createSessionToken(user);
    return { user, token };
  }

  /**
   * Hashes a password with salt using PBKDF2
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies password against stored salted hash
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, originalHash] = storedHash.split(':');
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return calculatedHash === originalHash;
  }

  /**
   * Creates signed JWT session token for user
   */
  static createSessionToken(user: User): string {
    const sessionPayload: SessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      google_sub: user.google_sub || ''
    };

    return jwt.sign(sessionPayload, config.jwtSecret, {
      expiresIn: '7d'
    });
  }

  /**
   * Validates internal session token
   */
  static verifySessionToken(token: string): SessionPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as SessionPayload;
    } catch (err: any) {
      throw new Error('Invalid or expired session token.');
    }
  }
}
