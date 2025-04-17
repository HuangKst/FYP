import express from 'express';
import EmployeeLeave from '../Models/employeeLeaveModel.js';
import Employee from '../Models/employeeModel.js';
import { Op } from 'sequelize';
import { generatePDF, sendPDFResponse, handlePDFError } from '../utils/pdfGenerator.js';

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

/**
 * GET /api/employee-leaves/employee/:id/pdf
 * 根据员工ID和日期范围导出请假记录为PDF
 */
router.get('/employee/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // 获取员工信息
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, msg: 'Employee not found.' });
    }
    
    // 构建查询条件
    const where = { employee_id: id };
    if (startDate && endDate) {
      where.start_date = {
        [Op.gte]: new Date(startDate)
      };
      where.end_date = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    console.log('查询条件:', where);
    
    // 获取请假记录
    const leaves = await EmployeeLeave.findAll({ 
      where,
      order: [['start_date', 'DESC']]
    });
    
    console.log(`找到 ${leaves.length} 条记录`);
    
    // 计算总请假天数
    const totalDays = leaves.reduce((sum, record) => {
      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包括首尾两天
      return sum + diffDays;
    }, 0);
    
    console.log('总请假天数:', totalDays);
    
    // 准备PDF模板数据
    const templateData = {
      employee: employee,
      leaves: leaves,
      filterStartDate: startDate,
      filterEndDate: endDate,
      totalDays: totalDays,
      generatedDate: new Date().toLocaleDateString()
    };
    
    // 使用通用PDF生成工具生成PDF
    const pdfBuffer = await generatePDF(templateData, 'leave');
    
    // 发送PDF响应
    sendPDFResponse(res, pdfBuffer, `employee-${id}-leave.pdf`);
  } catch (err) {
    handlePDFError(res, err);
  }
});

export default router;
