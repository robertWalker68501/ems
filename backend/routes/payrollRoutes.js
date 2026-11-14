import { Router } from 'express';
import { isAdmin, verifyToken } from '../middlewares/authMiddleware.js';
import {
  createPayroll,
  getPayrolls,
} from '../controllers/payrollController.js';

const payrollRouter = Router();

payrollRouter.post('/', verifyToken, isAdmin, createPayroll);
payrollRouter.get('/', verifyToken, getPayrolls);

export default payrollRouter;
