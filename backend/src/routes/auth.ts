import { Router } from 'express';
import { register, googleAuth, emailPasswordLogin, demoLogin, getMe, logout } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', emailPasswordLogin);
authRouter.post('/demo', demoLogin);
authRouter.post('/google', googleAuth);
authRouter.post('/firebase', googleAuth);
authRouter.get('/me', authMiddleware, getMe);
authRouter.post('/logout', logout);

export default authRouter;
