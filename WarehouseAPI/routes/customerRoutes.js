import express from 'express';
import Customer from '../Models/customerModel.js';
import Order from '../Models/orderModel.js';
import { Op } from 'sequelize';
import { generateCustomerOrdersPDF } from '../utils/pdfGenerator.js';
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

/**
 * GET /api/customers/:id/orders/pdf
 * 生成客户订单PDF报告
 */
router.get('/:id/orders/pdf', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { startDate, endDate, status, paymentStatus } = req.query;
    
    console.log(`接收到PDF生成请求，客户ID: ${customerId}, 过滤条件:`, req.query);
    
    // 查询客户信息
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, msg: '未找到客户' });
    }
    
    // 构建查询条件
    const where = { customer_id: customerId };
    
    // 添加日期过滤
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.created_at = { [Op.lte]: new Date(endDate) };
    }
    
    // 添加订单状态过滤
    if (status === 'completed') {
      where.is_completed = 1;
    } else if (status === 'pending') {
      where.is_completed = 0;
    }
    
    // 添加支付状态过滤
    if (paymentStatus === 'paid') {
      where.is_paid = 1;
    } else if (paymentStatus === 'unpaid') {
      where.is_paid = 0;
    }
    
    console.log('查询条件:', where);
    
    // 查询订单
    const orders = await Order.findAll({
      where,
      order: [['created_at', 'DESC']],
      raw: true
    });
    
    console.log(`找到 ${orders.length} 个订单`);
    
    // 计算未付款总额
    const totalUnpaid = orders
      .filter(order => order.is_paid === 0)
      .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    
    // 格式化数据用于PDF生成
    const formattedOrders = orders.map(order => ({
      _id: order.id,
      orderNumber: order.order_number,
      orderDate: order.created_at,
      status: order.is_completed ? 'completed' : 'pending',
      paymentStatus: order.is_paid ? 'paid' : 'unpaid',
      totalAmount: order.total_price,
      remark: order.remark || ''
    }));
    
    const formattedCustomer = {
      name: customer.name,
      contactPerson: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    };
    
    // 构建过滤器对象
    const filters = {
      startDate,
      endDate,
      status,
      paymentStatus
    };
    
    // 构建传递给PDF生成器的数据
    const pdfData = {
      customer: formattedCustomer,
      orders: formattedOrders,
      totalUnpaid,
      filters
    };
    
    console.log('准备生成PDF，数据结构:', JSON.stringify({
      customer: formattedCustomer,
      ordersCount: formattedOrders.length,
      totalUnpaid,
      filters
    }));
    
    // 生成PDF并发送响应
    await generateCustomerOrdersPDF(req, res, pdfData);
    
  } catch (err) {
    console.error('生成客户订单PDF报告时出错:', err);
    res.status(500).json({ success: false, msg: '服务器错误', error: err.message });
  }
});

export default router;
