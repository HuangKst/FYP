import express from 'express';
import Customer from '../Models/customerModel.js';
import Order from '../Models/orderModel.js';
import OrderItem from '../Models/orderItemModel.js';
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
    const { 
      showUnpaid = 'true', 
      status, 
      paymentStatus, 
      orderType,  // 新增订单类型筛选
      orderNumber, // 新增订单号筛选
      includeAllOrders = 'true', // 修改默认值为true，包含所有订单
      unpaidAmount,    // 从前端传入的未付款总额
      ordersData,      // 新增：前端传递的订单数据（从搜索API获取的）
      customerName,    // 新增：客户名称
      useSearchApiData // 新增：标记是否使用搜索API数据
    } = req.query;
    
    // 打印请求参数
    console.log('PDF导出请求详细参数:', JSON.stringify({
      customerId,
      showUnpaid,
      status,
      paymentStatus,
      orderType,
      orderNumber,
      includeAllOrders,
      unpaidAmount,
      useSearchApiData,
      hasOrdersData: !!ordersData
    }, null, 2));
    
    // 1. 查询客户信息
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, msg: '未找到客户' });
    }
    
    let orders = [];
    
    // 检查是否使用前端传递的订单数据
    if (ordersData && useSearchApiData === 'true') {
      try {
        console.log('使用前端传递的订单数据');
        // 解析前端传递的订单数据
        const parsedOrders = JSON.parse(ordersData);
        console.log(`成功解析前端传递的订单数据: ${parsedOrders.length} 个订单`);
        
        // 加载订单详情 - 使用前端传递的数据
        orders = await Promise.all(parsedOrders.map(async (orderData) => {
          // 从数据库获取完整订单数据（包括订单项）
          const order = await Order.findByPk(orderData.id, {
            include: [{ model: OrderItem }]
          });
          
          if (!order) {
            console.log(`警告: 订单ID ${orderData.id} 未找到`);
            return null;
          }
          
          return order;
        }));
        
        // 过滤掉null值（未找到的订单）
        orders = orders.filter(order => order !== null);
        
        console.log(`成功加载 ${orders.length} 个订单详情`);
      } catch (error) {
        console.error('解析前端传递的订单数据失败:', error);
        // 如果解析失败，使用原有方式查询订单
        // 不中断请求，继续使用常规方式查询
      }
    }
    
    // 如果没有有效的前端传递的订单数据，使用原有方式查询
    if (orders.length === 0) {
      console.log('未使用前端传递的订单数据或数据无效，使用常规查询方式');
      
      // 2. 构建订单查询条件
      let where = { customer_id: customerId };
      
      // 明确检查includeAllOrders的值
      console.log(`includeAllOrders参数值: "${includeAllOrders}", 类型: ${typeof includeAllOrders}`);
      // 修改：强制设置shouldIncludeAllOrders为true，确保始终获取所有订单
      const shouldIncludeAllOrders = true;
      console.log(`是否应包含所有订单: ${shouldIncludeAllOrders} (已强制为true)`);
      
      // 如果不是包含所有订单，则应用过滤条件
      if (!shouldIncludeAllOrders) {
        // 添加订单类型筛选
        if (orderType) {
          // 不转大写，直接使用orderType
          where.order_type = orderType;
        }
        
        // 添加订单号筛选
        if (orderNumber) {
          where.order_number = { [Op.like]: `%${orderNumber}%` };
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
      } else {
        console.log('请求包含所有订单，不应用筛选条件');
      }
      
      console.log('PDF查询条件:', where);
      
      // 3. 查询订单 - 包含OrderItem并设置不处理为原始数据
      orders = await Order.findAll({
        where,
        order: [['created_at', 'DESC']],
        include: [
          { 
            model: OrderItem,
            required: false  // 使用左连接，即使没有订单项也返回订单
          }
        ],
        raw: false
      });
      
      console.log(`找到 ${orders.length} 个订单, 客户ID: ${customerId}`);
      
      // 修改判断逻辑：只有在没有找到订单且不是主动要求包含所有订单时才进行处理
      if (orders.length === 0 && !shouldIncludeAllOrders) {
        console.log('未找到符合条件的订单，尝试获取全部订单');
        // 如果没有找到订单，尝试获取所有订单
        const allOrders = await Order.findAll({
          where: { customer_id: customerId },
          order: [['created_at', 'DESC']],
          include: [
            { 
              model: OrderItem,
              required: false  // 使用左连接
            }
          ],
          raw: false
        });
        console.log(`找到 ${allOrders.length} 个全部订单`);
        
        // 打印所有订单的基本信息，帮助调试
        allOrders.forEach((order, index) => {
          console.log(`全部订单 ${index+1}/${allOrders.length}: ID=${order.id}, 订单号=${order.order_number}, 类型=${order.order_type}, 订单项数量=${order.OrderItems ? order.OrderItems.length : 0}`);
        });
        
        // 如果确实有订单但筛选后没有，则提示用户是否要导出所有订单
        if (allOrders.length > 0) {
          console.log('检测到有订单但筛选条件过滤了所有结果，提示是否导出所有订单');
          // 返回提示用户是否要导出所有订单
          return res.status(200).json({ 
            success: false, 
            msg: '当前筛选条件下没有订单，但有其他订单。',
            allOrdersCount: allOrders.length,
            suggestExportAll: true
          });
        }
      } else if (orders.length === 0 && shouldIncludeAllOrders) {
        // 如果明确要求包含所有订单，但没有找到任何订单，获取所有订单
        console.log('未找到符合条件的订单，但请求包含所有订单，尝试获取全部订单');
        const allOrders = await Order.findAll({
          where: { customer_id: customerId },
          order: [['created_at', 'DESC']],
          include: [
            { 
              model: OrderItem,
              required: false  // 使用左连接
            }
          ],
          raw: false
        });
        
        console.log(`找到 ${allOrders.length} 个全部订单`);
        
        // 使用所有订单
        orders = allOrders;
      }
    }
    
    // 打印每个订单的基本信息和订单项数量，帮助调试
    orders.forEach((order, index) => {
      console.log(`订单 ${index+1}/${orders.length}: ID=${order.id}, 订单号=${order.order_number}, 类型=${order.order_type}, 订单项数量=${order.OrderItems ? order.OrderItems.length : 0}`);
    });
    
    // 4. 计算未付款总额
    const totalUnpaid = orders
      .filter(order => order.is_paid === 0 && order.order_type === 'SALES')
      .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    
    // 5. 格式化数据用于PDF生成
    console.log(`开始格式化订单数据，共 ${orders.length} 个订单`);
    
    const formattedOrders = orders.map((order, index) => {
      // 计算订单项总计
      const orderItems = order.OrderItems || [];
      console.log(`格式化订单 ${index+1}: ID=${order.id}, 订单号=${order.order_number}, 订单项数量=${orderItems.length}`);
      
      const items = orderItems.map(item => ({
        material: item.material,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit || 'PCS',
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }));
      
      return {
        _id: order.id,
        orderNumber: order.order_number,
        orderDate: order.created_at,
        status: order.is_completed ? 'completed' : 'pending',
        paymentStatus: order.is_paid ? 'paid' : 'unpaid',
        totalAmount: order.total_price,
        remark: order.remark || '',
        items: items
      };
    });
    
    console.log(`格式化后的订单数量: ${formattedOrders.length}`);
    
    // 确认所有订单都被正确处理
    formattedOrders.forEach((order, index) => {
      console.log(`确认格式化订单 ${index+1}/${formattedOrders.length}: 订单号=${order.orderNumber}, 项目数=${order.items.length}`);
    });

    const formattedCustomer = {
      name: customer.name,
      contactPerson: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    };
    
    // 6. 构建PDF数据
    const pdfData = {
      customer: formattedCustomer,
      orders: formattedOrders,
      // 使用前端传递的未付款总额(如果有)，否则使用后端计算的总额
      totalUnpaid: unpaidAmount ? parseFloat(unpaidAmount) : totalUnpaid,
      // 显示控制 - 直接使用请求参数
      showUnpaid: showUnpaid === 'true',
      filters: {
        orderType,
        orderNumber,
        status,
        paymentStatus
      }
    };
    
    console.log('构建PDF数据:', {
      ordersCount: formattedOrders.length,
      showUnpaid: showUnpaid === 'true',
      totalUnpaid: unpaidAmount ? parseFloat(unpaidAmount) : totalUnpaid
    });
    
    // 检查最终传递给PDF生成器的数据
    console.log(`PDF数据订单数组长度: ${pdfData.orders.length}`);
    console.log('PDF数据订单摘要:', pdfData.orders.map(o => ({
      orderId: o._id,
      orderNumber: o.orderNumber,
      itemsCount: o.items ? o.items.length : 0
    })));
    
    // 7. 生成PDF (这里直接使用import的函数)
    const { generatePDF } = await import('../utils/pdfGenerator.js');
    const pdfBuffer = await generatePDF(pdfData, 'customerOrders');
    
    // 8. 发送PDF响应
    const filename = `${customer.name.replace(/\s+/g, '_')}_Orders_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer, 'binary');
    
  } catch (err) {
    console.error('生成客户订单PDF报告时出错:', err);
    res.status(500).json({ success: false, msg: '服务器错误', error: err.message });
  }
});

export default router;
