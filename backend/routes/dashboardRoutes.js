import { Router } from 'express';
import { isAdmin, verifyToken } from '../middlewares/authMiddleware.js';
import { getChartData } from '../controllers/dashboardController.js';

const dashboardRouter = Router();

dashboardRouter.get('/charts', verifyToken, isAdmin, getChartData);

export default dashboardRouter;
