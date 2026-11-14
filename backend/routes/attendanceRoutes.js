import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  getAttendanceByDate,
  getAttendanceHistory,
  markAttendance,
} from '../controllers/attendanceController.js';

const attendanceRouter = Router();

attendanceRouter.post('/mark', verifyToken, markAttendance);
attendanceRouter.get('/', verifyToken, getAttendanceHistory);

attendanceRouter.get('/:date', verifyToken, getAttendanceByDate);

export default attendanceRouter;
