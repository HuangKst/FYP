import express from 'express';
import Employee from '../Models/employeeModel.js';
import { Op } from 'sequelize';

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

export default router;
