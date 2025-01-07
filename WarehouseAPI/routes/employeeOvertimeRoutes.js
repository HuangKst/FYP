import express from 'express';
import EmployeeOvertime from '../Models/employeeOvertimeModel.js';

const router = express.Router();

/**
 * GET /api/employee-overtimes
 * 查询所有加班记录
 */
router.get('/', async (req, res) => {
  try {
    const overtimes = await EmployeeOvertime.findAll();
    res.json({ success: true, overtimes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to retrieve overtime records.' });
  }
});

/**
 * POST /api/employee-overtimes
 * 创建加班记录
 */
router.post('/', async (req, res) => {
  try {
    const { employee_id, overtime_date, hours, reason } = req.body;
    if (!employee_id || !overtime_date || !hours) {
      return res.status(400).json({ success: false, msg: 'employee_id, overtime_date, hours are required.' });
    }
    const newOvertime = await EmployeeOvertime.create({ employee_id, overtime_date, hours, reason });
    res.status(201).json({ success: true, overtime: newOvertime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to create overtime record.' });
  }
});

/**
 * DELETE /api/employee-overtimes/:id
 * 删除加班记录
 */
router.delete('/:id', async (req, res) => {
  try {
    const count = await EmployeeOvertime.destroy({ where: { id: req.params.id }});
    if (count === 0) {
      return res.status(404).json({ success: false, msg: 'Overtime record not found.' });
    }
    res.json({ success: true, msg: 'Overtime record deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to delete overtime record.' });
  }
});

export default router;
