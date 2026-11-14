import Payroll from '../models/Payroll.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';

// Create new payroll (admin)
export const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      empId,
      name,
      role,
      department,
      payDate,
      salaryPeriod,
      month,
      baseSalary,
      bonus,
      overtime,
      deduction,
      netSalary,
      status,
    } = req.body;

    if (
      !employeeId ||
      !empId ||
      !name ||
      !role ||
      !department ||
      !payDate ||
      !salaryPeriod ||
      !month ||
      baseSalary === undefined ||
      netSalary === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required payroll fields must be provided.',
      });
    }

    // Find the employee by employeeId (empId from request)
    const employee = await Employee.findOne({ employeeId: empId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    if (employee.salaryPeriod === 'year') {
      const yearPart = salaryPeriod.substring(0, 4);
      const existingYearly = await Payroll.findOne({
        employeeId,
        salaryPeriod: { $regex: `^${yearPart}-` },
      });

      if (existingYearly) {
        return res.status(400).json({
          success: false,
          message:
            'Payslip already generated for this employee in this calendar year.',
        });
      }
    } else {
      const existing = await Payroll.findOne({ employeeId, salaryPeriod });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Payslip already generated for this employee and period.',
        });
      }
    }

    // Generate  unique Payroll ID
    let payrollId = '';

    let unique = false;

    while (!unique) {
      const num = Math.floor(1000 + Math.random() * 9000);
      payrollId = `PAY-${num}`;
      const check = await Payroll.findOne({ payrollId });
      if (!check) {
        unique = true;
      }
    }

    const record = await Payroll.create({
      payrollId,
      employeeId,
      empId,
      name,
      role,
      department,
      payDate,
      salaryPeriod,
      month,
      baseSalary,
      bonus: bonus || 0,
      overtime: overtime || 0,
      deduction: deduction || 0,
      netSalary,
      status: status || 'Paid',
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Payslip generated successfully.',
      record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get payroll records (admin can see all, while employees see their own)
export const getPayrolls = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    let query = {};

    if (user.role !== 'admin') {
      const employee = await Employee.findOne({
        workEmail: user.email.toLowerCase(),
      });

      if (!employee) {
        return res.status(200).json({
          success: true,
          records: [],
        }); // For no matching doc for this employee
      }

      query = { employeeId: employee._id };
    }

    const records = await Payroll.find(query)
      .populate('employeeId')
      .sort({ payDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
