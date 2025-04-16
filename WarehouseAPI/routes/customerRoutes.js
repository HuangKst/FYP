import express from 'express';
import Customer from '../Models/customerModel.js';
import { Op } from 'sequelize';
// import { authRequired } from '../middlewares/authRequired.js';

const router = express.Router();

/**
 * GET /api/customers
 * 查询所有客户, 按姓名 A-Z 排序
 */
router.get('/', async (req, res) => {
  try {
    const { name, page = 1, pageSize = 20 } = req.query;
    const where = {};
    
    // 添加名称搜索条件
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    
    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // 获取总记录数
    const count = await Customer.count({ where });
    
    // 获取分页数据
    const customers = await Customer.findAll({ 
      where,
      order: [['name','ASC']],
      offset,
      limit
    });
    
    res.json({ 
      success: true, 
      customers,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

/**
 * POST /api/customers
 * 添加新客户
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, remark } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, msg: 'Customer name is required' });
    }
    const newCus = await Customer.create({ name, phone, address, remark });
    res.status(201).json({ success: true, customer: newCus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

/**
 * GET /api/customers/:id
 * 查询某个客户详情 (包括已付订单、未付订单等)
 */
router.get('/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    // 需要 include 订单 -> 这里可进一步区分已付/未付
    // 先简化
    // import Order from '../Models/orderModel.js';
    // ...
    // const customer = await Customer.findByPk(customerId, { include: Order });
    // 先仅返回客户
    const customer = await Customer.findByPk(customerId);
    if (!customer) return res.status(404).json({ success: false, msg: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

/**
 * PUT /api/customers/:id
 * 修改客户
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, address, remark } = req.body;
    const [count] = await Customer.update(
      { name, phone, address, remark },
      { where: { id: req.params.id } }
    );
    if (count === 0) {
      return res.status(404).json({ success: false, msg: 'Customer not found' });
    }
    res.json({ success: true, msg: 'Customer updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

/**
 * DELETE /api/customers/:id
 * 删除客户(需要管理员密码?)
 */
router.delete('/:id', async (req, res) => {
  try {
    // TODO: 确认订单等是否可删除
    const count = await Customer.destroy({ where: { id: req.params.id } });
    if (count === 0) return res.status(404).json({ success: false, msg: 'Customer not found' });
    res.json({ success: true, msg: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

export default router;
