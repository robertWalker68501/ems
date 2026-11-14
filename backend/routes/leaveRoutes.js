import { Router } from 'express';
import { isAdmin, verifyToken } from '../middlewares/authMiddleware.js';
import { applyLeave, getLeave } from '../controllers/leaveController.js';

const leaveRouter = Router();

leaveRouter.post('/apply', verifyToken, applyLeave);
leaveRouter.get('/', verifyToken, getLeave);

export default leaveRouter;
