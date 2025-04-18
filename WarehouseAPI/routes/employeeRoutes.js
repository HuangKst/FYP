import express from 'express';
import Employee from '../Models/employeeModel.js';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';
import EmployeeOvertime from '../Models/employeeOvertimeModel.js';
import EmployeeLeave from '../Models/employeeLeaveModel.js';

const router = express.Router();

/**
 * GET /api/employees
 * 查询所有员工
 */
router.get('/', async (req, res) => {
  try {
    const { name, page = 1, pageSize = 10 } = req.query;
    const where = {};
    
    // 添加名称搜索条件
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    
    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // 获取总记录数
    const count = await Employee.count({ where });
    
    // 获取分页数据
    const employees = await Employee.findAll({ 
      where,
      order: [['created_at','DESC']],
      offset,
      limit
    });
    
    res.json({ 
      success: true, 
      employees,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch employees' });
  }
});

/**
 * POST /api/employees
 * 新增员工
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, hire_date } = req.body;
    if (!name) return res.status(400).json({ success: false, msg: 'Name is required' });
    const newEmp = await Employee.create({ name, phone, hire_date });
    res.status(201).json({ success: true, employee: newEmp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to create employee' });
  }
});

/**
 * DELETE /api/employees/:id
 * 删除员工
 */
router.delete('/:id', async (req, res) => {
  try {
    // Possibly check for leave/overtime/orders first
    const count = await Employee.destroy({ where: { id: req.params.id }});
    if (count === 0) return res.status(404).json({ success: false, msg: 'Employee not found' });
    res.json({ success: true, msg: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to delete employee' });
  }
});

/**
 * GET /api/employee-overtimes/employee/:id/pdf
 * 导出指定员工的所有加班记录（PDF格式）
 */
router.get('/employee-overtimes/employee/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // 构建查询条件
    const where = { employee_id: id };
    if (startDate && endDate) {
      where.overtime_date = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    // 获取所有匹配的加班记录，不使用分页
    const overtimes = await EmployeeOvertime.findAll({
      where,
      include: [{
        model: Employee,
        attributes: ['name', 'employee_id', 'position', 'department']
      }],
      order: [['overtime_date', 'DESC']]
    });
    
    // 获取员工信息
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, msg: 'Employee not found' });
    }
    
    // 创建PDF文档
    const doc = new PDFDocument();
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=employee-${id}-overtime.pdf`);
    
    // 将PDF流式传输到响应
    doc.pipe(res);
    
    // 添加PDF内容
    doc.fontSize(18).text(`Overtime Records - ${employee.name}`, { align: 'center' });
    doc.moveDown();
    
    // 员工信息
    doc.fontSize(12).text(`Employee: ${employee.name}`);
    doc.fontSize(12).text(`Position: ${employee.position || 'N/A'}`);
    doc.fontSize(12).text(`Department: ${employee.department || 'N/A'}`);
    doc.moveDown();
    
    // 筛选条件
    if (startDate && endDate) {
      doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`);
      doc.moveDown();
    }
    
    // 计算总加班时间
    const totalHours = overtimes.reduce((sum, record) => sum + parseFloat(record.hours || 0), 0);
    doc.fontSize(12).text(`Total Overtime Hours: ${totalHours.toFixed(2)}`);
    doc.moveDown();
    
    // 表格标题
    doc.fontSize(12).text('Overtime Records:', { underline: true });
    doc.moveDown(0.5);
    
    // 表格列定义
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [100, 60, 250, 100];
    const colHeaders = ['Date', 'Hours', 'Reason', 'Created At'];
    
    // 绘制表头
    doc.font('Helvetica-Bold');
    colHeaders.forEach((header, i) => {
      let x = tableLeft;
      for (let j = 0; j < i; j++) {
        x += colWidths[j];
      }
      doc.text(header, x, tableTop);
    });
    doc.moveDown();
    
    // 绘制内容
    doc.font('Helvetica');
    overtimes.forEach((record) => {
      const y = doc.y;
      
      // 日期
      doc.text(new Date(record.overtime_date).toLocaleDateString(), tableLeft, y);
      
      // 小时
      doc.text(record.hours, tableLeft + colWidths[0], y);
      
      // 原因
      doc.text(record.reason || '-', tableLeft + colWidths[0] + colWidths[1], y);
      
      // 创建时间
      doc.text(new Date(record.created_at).toLocaleString(), 
               tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
      
      doc.moveDown();
    });
    
    // 如果没有记录
    if (overtimes.length === 0) {
      doc.text('No overtime records found.', tableLeft, doc.y);
    }
    
    // 完成PDF
    doc.end();
  } catch (error) {
    console.error('Error generating overtime PDF:', error);
    res.status(500).json({ success: false, msg: 'Failed to generate PDF' });
  }
});

/**
 * GET /api/employee-leaves/employee/:id/pdf
 * 导出指定员工的所有请假记录（PDF格式）
 */
router.get('/employee-leaves/employee/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // 构建查询条件
    const where = { employee_id: id };
    if (startDate && endDate) {
      where[Op.or] = [
        {
          start_date: { [Op.between]: [startDate, endDate] }
        },
        {
          end_date: { [Op.between]: [startDate, endDate] }
        }
      ];
    }
    
    // 获取所有匹配的请假记录，不使用分页
    const leaves = await EmployeeLeave.findAll({
      where,
      include: [{
        model: Employee,
        attributes: ['name', 'employee_id', 'position', 'department']
      }],
      order: [['start_date', 'DESC']]
    });
    
    // 获取员工信息
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ success: false, msg: 'Employee not found' });
    }
    
    // 创建PDF文档
    const doc = new PDFDocument();
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=employee-${id}-leave.pdf`);
    
    // 将PDF流式传输到响应
    doc.pipe(res);
    
    // 添加PDF内容
    doc.fontSize(18).text(`Leave Records - ${employee.name}`, { align: 'center' });
    doc.moveDown();
    
    // 员工信息
    doc.fontSize(12).text(`Employee: ${employee.name}`);
    doc.fontSize(12).text(`Position: ${employee.position || 'N/A'}`);
    doc.fontSize(12).text(`Department: ${employee.department || 'N/A'}`);
    doc.moveDown();
    
    // 筛选条件
    if (startDate && endDate) {
      doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`);
      doc.moveDown();
    }
    
    // 计算总请假天数
    const totalDays = leaves.reduce((sum, record) => {
      const startDate = new Date(record.start_date);
      const endDate = new Date(record.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包括首尾两天
      return sum + diffDays;
    }, 0);
    
    doc.fontSize(12).text(`Total Leave Days: ${totalDays}`);
    doc.moveDown();
    
    // 表格标题
    doc.fontSize(12).text('Leave Records:', { underline: true });
    doc.moveDown(0.5);
    
    // 表格列定义
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [100, 100, 200, 100];
    const colHeaders = ['Start Date', 'End Date', 'Reason', 'Created At'];
    
    // 绘制表头
    doc.font('Helvetica-Bold');
    colHeaders.forEach((header, i) => {
      let x = tableLeft;
      for (let j = 0; j < i; j++) {
        x += colWidths[j];
      }
      doc.text(header, x, tableTop);
    });
    doc.moveDown();
    
    // 绘制内容
    doc.font('Helvetica');
    leaves.forEach((record) => {
      const y = doc.y;
      
      // 开始日期
      doc.text(new Date(record.start_date).toLocaleDateString(), tableLeft, y);
      
      // 结束日期
      doc.text(new Date(record.end_date).toLocaleDateString(), tableLeft + colWidths[0], y);
      
      // 原因
      doc.text(record.reason || '-', tableLeft + colWidths[0] + colWidths[1], y);
      
      // 创建时间
      doc.text(new Date(record.created_at).toLocaleString(), 
               tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
      
      doc.moveDown();
    });
    
    // 如果没有记录
    if (leaves.length === 0) {
      doc.text('No leave records found.', tableLeft, doc.y);
    }
    
    // 完成PDF
    doc.end();
  } catch (error) {
    console.error('Error generating leave PDF:', error);
    res.status(500).json({ success: false, msg: 'Failed to generate PDF' });
  }
});

export default router;
