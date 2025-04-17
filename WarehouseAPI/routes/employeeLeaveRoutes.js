import express from 'express';
import EmployeeLeave from '../Models/employeeLeaveModel.js';
import Employee from '../Models/employeeModel.js';
import puppeteer from 'puppeteer';
import { generateLeaveTemplate } from '../templates/employeeLeaveimePDFTemplate.js';
import { Op } from 'sequelize';

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
    
    // 生成PDF
    const pdfBuffer = await generateEmployeePDF(templateData, 'leave');
    
    // 设置响应头并发送PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="employee-${id}-leave.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer, 'binary');
  } catch (err) {
    console.error('Error generating leave PDF:', err);
    res.status(500).json({ success: false, msg: 'Failed to generate PDF', error: err.message });
  }
});

/**
 * 生成员工记录PDF的函数
 * @param {Object} data - 数据对象
 * @param {string} type - 类型 ('overtime'/'leave')
 * @returns {Promise<Buffer>} - 返回PDF缓冲区
 */
async function generateEmployeePDF(data, type) {
  let browser = null;
  try {
    console.log('开始生成PDF...');
    
    // 根据类型获取不同的模板
    let templateHtml;
    if (type === 'leave') {
      templateHtml = generateLeaveTemplate(data);
    } else {
      throw new Error('Unsupported template type');
    }
    
    console.log('HTML模板已创建');
    
    // 配置Puppeteer选项
    const puppeteerOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--font-render-hinting=none'
      ],
      timeout: 60000
    };
    
    console.log('正在启动Puppeteer浏览器...');
    browser = await puppeteer.launch(puppeteerOptions);
    
    console.log('正在创建新页面...');
    const page = await browser.newPage();
    
    // 设置视口大小为A4
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1
    });
    
    // 设置页面内容
    console.log('正在设置页面内容...');
    await page.setContent(templateHtml, { 
      waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
      timeout: 30000
    });
    
    // 确保所有字体已加载
    await page.evaluate(() => document.fonts.ready);
    
    // 设置打印媒体类型
    await page.emulateMediaType('print');
    
    // 生成PDF
    console.log('正在生成PDF...');
    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      scale: 0.98
    });
    
    // 关闭浏览器
    console.log('PDF生成成功，正在关闭浏览器...');
    await browser.close();
    browser = null;
    
    console.log('PDF生成完毕，返回PDF缓冲区大小:', pdf.length);
    return pdf;
  } catch (error) {
    console.error('PDF生成失败:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('关闭浏览器失败:', closeError);
      }
    }
    throw error;
  }
}

export default router;
