import express from 'express';
import EmployeeLeave from '../Models/employeeLeaveModel.js';

const router = express.Router();

/**
 * GET /api/employee-leaves
 * 查询所有请假记录
 */
router.get('/', async (req, res) => {
  try {
    const leaves = await EmployeeLeave.findAll();
    res.json({ success: true, leaves });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to retrieve leave records.' });
  }
});

/**
 * POST /api/employee-leaves
 * 创建请假记录
 */
router.post('/', async (req, res) => {
  try {
    const { employee_id, start_date, end_date, reason } = req.body;
    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, msg: 'employee_id, start_date, end_date are required.' });
    }
    const newLeave = await EmployeeLeave.create({ employee_id, start_date, end_date, reason });
    res.status(201).json({ success: true, leave: newLeave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to create leave record.' });
  }
});

/**
 * DELETE /api/employee-leaves/:id
 * 删除请假记录
 */
router.delete('/:id', async (req, res) => {
  try {
    const count = await EmployeeLeave.destroy({ where: { id: req.params.id }});
    if (count === 0) {
      return res.status(404).json({ success: false, msg: 'Leave record not found.' });
    }
    res.json({ success: true, msg: 'Leave record deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to delete leave record.' });
  }
});

export default router;
