import express from 'express';
import Order from '../Models/orderModel.js';
import OrderItem from '../Models/orderItemModel.js';
import Customer from '../Models/customerModel.js';
import User from '../Models/userModel.js';
import Inventory from '../Models/inventoryModel.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * POST /api/orders
 * 生成订单 (下单 or 报价)
 * - body包含: order_type, customer_id, user_id, items([...]) 等
 */
router.post('/', async (req, res) => {
  try {
    const { order_type, customer_id, user_id, items = [], remark } = req.body;

    // 1. Generate order number (YYYYMMDD + xx)
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
    // TODO: Get today's order count and increment (simplified here)
    const orderNumber = dateStr + '00'; 

    // 2. Create Order
    const newOrder = await Order.create({
      order_number: orderNumber,
      order_type,
      customer_id,
      user_id,
      remark
    });

    // 3. Create OrderItems
    //    Iterate through items array
    let totalPrice = 0;
    for (let it of items) {
      // it={ material, specification, quantity, unit, weight, unit_price, ... }
      // Calculate subtotal
      const subtotal = it.weight 
        ? (parseFloat(it.weight) * parseFloat(it.unit_price)).toFixed(2) 
        : (parseFloat(it.quantity) * parseFloat(it.unit_price)).toFixed(2);
      
      totalPrice += parseFloat(subtotal);

      await OrderItem.create({
        order_id: newOrder.id,
        material: it.material,
        specification: it.specification,
        quantity: it.quantity,
        unit: it.unit || 'piece',
        weight: it.weight || 0,
        unit_price: it.unit_price || 0,
        subtotal,
        remark: it.remark || ''
      });
    }
    
    // 更新订单总金额
    await newOrder.update({ total_price: totalPrice.toFixed(2) });

    // If it's a SALES order, reduce inventory
    if (order_type === 'SALES') {
      for (let it of items) {
        // Reduce inventory
        const inv = await Inventory.findOne({ 
          where: { material: it.material, specification: it.specification }
        });
        if (!inv) {
          // Decide whether to throw an error or automatically create inventory
        } else {
          // If quantity exceeds inventory, notify?
          const newQty = parseFloat(inv.quantity) - parseFloat(it.quantity || 0);
          if (newQty < 0) {
            // throw new Error('Insufficient inventory'); // or notify directly
          }
          await inv.update({ quantity: newQty });
        }
      }
    }

    res.status(201).json({ success: true, orderId: newOrder.id, order_number: newOrder.order_number });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to create order', error: err.message });
  }
});

/**
 * GET /api/orders
 * 查询所有订单, 可附加查询: type=QUOTE/SALES, is_paid, is_completed, etc.
 */
router.get('/', async (req, res) => {
  try {
    const { type, paid, completed, customerName } = req.query;
    const where = {};
    if (type) where.order_type = type;
    if (paid !== undefined) where.is_paid = (paid === 'true');
    if (completed !== undefined) where.is_completed = (completed === 'true');

    const include = [
      { model: Customer },
      { model: User },
      { model: OrderItem }
    ];

    // 如果提供了客户名，添加客户名过滤条件
    if (customerName) {
      include[0].where = {
        name: { [Op.like]: `%${customerName}%` }
      };
    }

    const orders = await Order.findAll({
      where,
      order: [['created_at','DESC']],
      include
    });
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/:id
 * 查看单个订单 (包含OrderItems)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Customer },
        { model: User },
        { 
          model: OrderItem,
          // order by ??
        }
      ]
    });
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }
    
    // 计算订单总金额，确保响应中包含total_price
    if (order.order_items && order.order_items.length > 0 && !order.total_price) {
      const totalPrice = order.order_items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal || 0);
      }, 0);
      order.total_price = totalPrice.toFixed(2);
    }
    
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch order' });
  }
});

/**
 * PUT /api/orders/:id
 * 更新订单 (比如设置 is_paid, is_completed)
 */
router.put('/:id', async (req, res) => {
  try {
    const { is_paid, is_completed, remark } = req.body;
    const [count] = await Order.update(
      { is_paid, is_completed, remark },
      { where: { id: req.params.id } }
    );
    if (count === 0) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }
    res.json({ success: true, msg: 'Order updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to update order' });
  }
});

/**
 * DELETE /api/orders/:id
 * 删除订单(需要管理员权限)
 */
router.delete('/:id', async (req, res) => {
  try {
    // 检查用户权限
    const user = req.user; // 假设通过中间件已经获取了用户信息
    
    // 如果没有用户信息或用户角色不是admin/superadmin，拒绝操作
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ 
        success: false, 
        msg: 'Permission denied. Only administrators can delete orders.' 
      });
    }
    
    // 权限验证通过，执行删除操作
    const count = await Order.destroy({ where: { id: req.params.id } });
    if (count === 0) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }
    res.json({ success: true, msg: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ success: false, msg: 'Failed to delete order' });
  }
});

export default router;
