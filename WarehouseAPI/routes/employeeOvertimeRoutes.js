import express from 'express';
import EmployeeOvertime from '../Models/employeeOverTimeModel.js';

import Employee from '../Models/employeeModel.js';
import { Op } from 'sequelize';
import { generatePDF, sendPDFResponse, handlePDFError } from '../utils/pdfGenerator.js';

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

/**
 * GET /api/employee-overtimes/employee/:id/pdf
 * 根据员工ID和日期范围导出加班记录为PDF
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
      where.overtime_date = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }
    
    console.log('查询条件:', where);
    
    // 获取加班记录
    const overtimes = await EmployeeOvertime.findAll({ 
      where,
      order: [['overtime_date', 'DESC']]
    });
    
    console.log(`找到 ${overtimes.length} 条记录`);
    
    // 计算总加班时间
    const totalHours = overtimes.reduce((sum, record) => {
      return sum + parseFloat(record.hours || 0);
    }, 0).toFixed(2);
    
    console.log('总加班时间:', totalHours);
    
    // 准备PDF模板数据
    const templateData = {
      employee: employee,
      overtimes: overtimes,
      filterStartDate: startDate,
      filterEndDate: endDate,
      totalHours: totalHours,
      generatedDate: new Date().toLocaleDateString()
    };
    
    // 使用通用PDF生成工具生成PDF
    const pdfBuffer = await generatePDF(templateData, 'overtime');
    
    // 发送PDF响应
    sendPDFResponse(res, pdfBuffer, `employee-${id}-overtime.pdf`);
  } catch (err) {
    handlePDFError(res, err);
  }
});

export default router;
