import { Router } from 'express';
import authRouter from './auth.js';
import meetingsRouter from './meetings.js';
import actionsRouter from './actions.js';
import decisionsRouter from './decisions.js';
import unresolvedRouter from './unresolved.js';
import statsRouter from './stats.js';
import systemRouter from './health.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const apiRouter = Router();

// Authentication endpoints: /api/auth/google, /api/auth/me, /api/auth/logout
apiRouter.use('/auth', authRouter);

// Protected resource endpoints
apiRouter.use('/meetings', authMiddleware, meetingsRouter);
apiRouter.use('/actions', authMiddleware, actionsRouter);
apiRouter.use('/action-items', authMiddleware, actionsRouter);
apiRouter.use('/decisions', authMiddleware, decisionsRouter);
apiRouter.use('/unresolved', authMiddleware, unresolvedRouter);
apiRouter.use('/stats', authMiddleware, statsRouter);

// System routes (health check is public, reset/backup are protected within systemRouter)
apiRouter.use('/', systemRouter);

export default apiRouter;
