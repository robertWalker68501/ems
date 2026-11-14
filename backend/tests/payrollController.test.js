import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { getPayrolls } from '../controllers/payrollController.js';
import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';
import User from '../models/User.js';

for (const role of ['admin', 'employee']) {
  test(`GET payroll sorts records for ${role}`, async (t) => {
    const employeeId = new mongoose.Types.ObjectId();
    const records = [{ payDate: '2026-11-01' }, { payDate: '2026-10-01' }];
    const find = Payroll.find;
    let payrollQuery;

    t.mock.method(User, 'findById', async () => ({
      role,
      email: 'employee@example.com',
    }));
    t.mock.method(Employee, 'findOne', async () => ({ _id: employeeId }));
    t.mock.method(Payroll, 'find', (filter) => {
      payrollQuery = find.call(Payroll, filter);
      t.mock.method(payrollQuery, 'exec', async () => records);
      return payrollQuery;
    });

    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };

    await getPayrolls({ user: { id: 'user-id' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, records });
    assert.deepEqual(payrollQuery.getOptions().sort, {
      payDate: -1,
      createdAt: -1,
    });
    assert.deepEqual(
      payrollQuery.getFilter(),
      role === 'admin' ? {} : { employeeId }
    );
    assert.ok(payrollQuery._mongooseOptions.populate.employeeId);
  });
}
