import { Router } from 'express';
import meetingsRouter from './meetings.js';
import actionsRouter from './actions.js';
import decisionsRouter from './decisions.js';
import unresolvedRouter from './unresolved.js';
import statsRouter from './stats.js';
import systemRouter from './health.js';

const apiRouter = Router();

apiRouter.use('/meetings', meetingsRouter);
apiRouter.use('/actions', actionsRouter);
apiRouter.use('/decisions', decisionsRouter);
apiRouter.use('/unresolved', unresolvedRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/', systemRouter);

export default apiRouter;
