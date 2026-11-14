import { Router } from 'express';
import { isAdmin, verifyToken } from '../middlewares/authMiddleware.js';
import {
  getAllLeaves,
  getAttendanceDashboard,
  getAttendanceList,
  getEmployeeAttendanceDetails,
  decideLeave,
} from '../controllers/adminAttendanceController.js';

const adminRouter = Router();

adminRouter.get('/dashboard', verifyToken, isAdmin, getAttendanceDashboard);
adminRouter.get('/list', verifyToken, isAdmin, getAttendanceList);

adminRouter.get('/leaves', verifyToken, isAdmin, getAllLeaves);
adminRouter.get(
  '/employee/:id',
  verifyToken,
  isAdmin,
  getEmployeeAttendanceDetails
);

adminRouter.put('/leaves/:id', verifyToken, isAdmin, decideLeave);

export default adminRouter;
