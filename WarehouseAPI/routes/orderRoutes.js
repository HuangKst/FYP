import express from 'express';
import Order from '../Models/orderModel.js';
import OrderItem from '../Models/orderItemModel.js';
import Customer from '../Models/customerModel.js';
import User from '../Models/userModel.js';
import Inventory from '../Models/inventoryModel.js';
import { Op } from 'sequelize';
import { sequelize } from '../db/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateOrderTemplate } from '../templates/orderPDFTemplate.js';
import { generatePDF, sendPDFResponse, handlePDFError } from '../utils/pdfGenerator.js';
import authenticate from '../authenticate/index.js';
import adminAuth from '../authenticate/adminAuth.js';
import employeeOrderAuth from '../authenticate/employeeOrderAuth.js';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * POST /api/orders
 * 生成订单 (下单 or 报价)
 * - body包含: order_type, customer_id, user_id, items([...]) 等
 */
router.post('/', async (req, res) => {
  const t = await sequelize.transaction(); // 开始事务

  try {
    const { order_type, customer_id, items = [], remark } = req.body;
    
    // 使用当前登录用户的ID
    const user_id = req.user.userId;

    // 1. Generate order number (YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
    
    // 查询当天最新的订单号
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayOrders = await Order.findAll({
      where: {
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay
        },
        order_number: {
          [Op.like]: `${dateStr}%`
        }
      },
      order: [['order_number', 'DESC']],
      limit: 1
    });
    
    // 计算今天的订单序号
    let sequenceNumber = 0;
    
    if (todayOrders && todayOrders.length > 0) {
      // 从最新订单号中提取序号部分并加1
      const latestOrderNumber = todayOrders[0].order_number;
      const sequencePart = latestOrderNumber.substring(dateStr.length);
      sequenceNumber = parseInt(sequencePart, 10) + 1;
    }
    
    // 格式化为4位数字，不足前面补0
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    
    // 最终订单号格式: YYYYMMDD-XXXX (例如: 20240421-0001)
    const orderNumber = `${dateStr}${formattedSequence}`;

    // 2. Create Order
    const newOrder = await Order.create({
      order_number: orderNumber,
      order_type,
      customer_id,
      user_id,
      remark
    }, { transaction: t });

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
      }, { transaction: t });
    }
    
    // 更新订单总金额
    await newOrder.update({ total_price: totalPrice.toFixed(2) }, { transaction: t });

    // If it's a SALES order, reduce inventory and update customer debt
    if (order_type === 'SALES') {
      // 更新库存
      for (let it of items) {
        // Reduce inventory
        const inv = await Inventory.findOne({ 
          where: { material: it.material, specification: it.specification }
        }, { transaction: t });
        if (!inv) {
          // Decide whether to throw an error or automatically create inventory
        } else {
          // If quantity exceeds inventory, notify?
          const newQty = parseFloat(inv.quantity) - parseFloat(it.quantity || 0);
          if (newQty < 0) {
            // throw new Error('Insufficient inventory'); // or notify directly
          }
          await inv.update({ quantity: newQty }, { transaction: t });
        }
      }

      // 如果是销售订单且未付款，增加客户的total_debt
      const isPaid = req.body.is_paid || false; // 假设默认未付款
      if (!isPaid) {
        // 查找客户并更新total_debt
        const customer = await Customer.findByPk(customer_id, { transaction: t });
        if (customer) {
          const newDebt = parseFloat(customer.total_debt || 0) + totalPrice;
          await customer.update({ total_debt: newDebt.toFixed(2) }, { transaction: t });
          console.log(`Updated customer ${customer.name} total_debt: +${totalPrice} = ${newDebt}`);
        }
      }
    }

    await t.commit(); // 提交事务
    res.status(201).json({ success: true, orderId: newOrder.id, order_number: newOrder.order_number });
  } catch (err) {
    await t.rollback(); // 回滚事务
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
    const { type, paid, completed, customerName, customerId, orderNumber, page = 1, pageSize = 10 } = req.query;
    const where = {};
    
    // 基础过滤条件
    if (type) where.order_type = type;
    if (paid !== undefined) where.is_paid = (paid === 'true');
    if (completed !== undefined) where.is_completed = (completed === 'true');
    if (customerId) where.customer_id = customerId;
    if (orderNumber) where.order_number = { [Op.like]: `%${orderNumber}%` };
    
    // 如果是员工角色，只能查看自己的订单
    if (req.user && req.user.userRole === 'employee') {
      where.user_id = req.user.userId;
      console.log(`Filtering orders for employee user: ${req.user.userId}`);
    }

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

    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 获取总记录数
    const count = await Order.count({
      where,
      include: customerName ? [{ model: Customer, where: { name: { [Op.like]: `%${customerName}%` } } }] : []
    });

    // 获取分页数据
    const orders = await Order.findAll({
      where,
      order: [['created_at','DESC']],
      include,
      offset,
      limit
    });

    res.json({ 
      success: true, 
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/:id
 * 查看单个订单 (包含OrderItems)
 */
router.get('/:id', employeeOrderAuth, async (req, res) => {
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
 * Update order status (e.g. is_paid, is_completed, order_type)
 */
router.put('/:id', employeeOrderAuth, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { is_paid, is_completed, remark, order_type } = req.body;
    const orderId = req.params.id;
    
    // Get original order info
    const order = await Order.findByPk(orderId, {
      include: [{ model: Customer }]
    });
    
    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }
    
    // Check if payment status changed and if it's a sales order
    const isPaidChanged = is_paid !== undefined && is_paid !== order.is_paid;
    const isSalesOrder = order.order_type === 'SALES';
    
    // Check if order type changed from QUOTE to SALES
    const isTypeChangedToSales = order_type === 'SALES' && order.order_type === 'QUOTE';
    
    // Update order
    const updateFields = { 
      remark: remark !== undefined ? remark : order.remark 
    };
    
    // Add optional fields if provided
    if (is_paid !== undefined) updateFields.is_paid = is_paid;
    if (is_completed !== undefined) updateFields.is_completed = is_completed;
    if (order_type !== undefined) updateFields.order_type = order_type;
    
    const [count] = await Order.update(
      updateFields,
      { where: { id: orderId }, transaction: t }
    );
    
    if (count === 0) {
      await t.rollback();
      return res.status(404).json({ success: false, msg: 'Order not found or no updates applied' });
    }
    
    // Process inventory and customer debt if order type changed from QUOTE to SALES
    if (isTypeChangedToSales) {
      console.log(`Converting order ${orderId} from QUOTE to SALES`);
      
      // 1. Update inventory for all order items
      const orderItems = await OrderItem.findAll({
        where: { order_id: orderId },
        transaction: t
      });
      
      for (const item of orderItems) {
        const inventory = await Inventory.findOne({
          where: { 
            material: item.material,
            specification: item.specification
          },
          transaction: t
        });
        
        if (inventory) {
          // Reduce inventory based on order item quantity
          const newQuantity = parseFloat(inventory.quantity) - parseFloat(item.quantity || 0);
          await inventory.update({ quantity: newQuantity }, { transaction: t });
          console.log(`Updated inventory for ${item.material}: -${item.quantity} = ${newQuantity}`);
        }
      }
      
      // 2. Update customer debt (only if the order is not marked as paid)
      const isPaidValue = is_paid !== undefined ? is_paid : order.is_paid;
      if (!isPaidValue) {
        const customer = await Customer.findByPk(order.customer_id, { transaction: t });
        const orderTotal = parseFloat(order.total_price || 0);
        
        if (customer) {
          const newDebt = parseFloat(customer.total_debt || 0) + orderTotal;
          await customer.update({ total_debt: newDebt.toFixed(2) }, { transaction: t });
          console.log(`Updated customer ${customer.name} debt: +${orderTotal} = ${newDebt}`);
        }
      }
    }
    // Handle debt changes for existing sales orders with payment status changes
    else if (isSalesOrder && isPaidChanged) {
      const customerId = order.customer_id;
      const orderTotal = parseFloat(order.total_price || 0);
      
      // Get customer info
      const customer = await Customer.findByPk(customerId, { transaction: t });
      
      if (customer) {
        let newDebt = parseFloat(customer.total_debt || 0);
        
        if (is_paid) {
          // Reduce debt after payment
          newDebt -= orderTotal;
          console.log(`Customer paid order: Reducing debt by ${orderTotal}`);
        } else {
          // Increase debt when payment status cancelled
          newDebt += orderTotal;
          console.log(`Order payment canceled: Increasing debt by ${orderTotal}`);
        }
        
        // Ensure debt is not negative
        newDebt = Math.max(0, newDebt);
        
        // Update customer debt
        await customer.update({ total_debt: newDebt.toFixed(2) }, { transaction: t });
        console.log(`Updated customer ${customer.name} debt: ${is_paid ? '-' : '+'}${orderTotal} = ${newDebt}`);
      }
    }
    
    await t.commit();
    res.json({ success: true, msg: 'Order updated successfully' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to update order' });
  }
});

/**
 * DELETE /api/orders/:id
 * 删除订单(需要管理员权限或员工只能删除自己的订单)
 */
router.delete('/:id', employeeOrderAuth, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    // 在删除前先获取订单信息和订单项目
    const orderId = req.params.id;
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem },
        { model: Customer }
      ]
    });
    
    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }
    
    // 如果是销售订单，处理库存和客户欠款
    if (order.order_type === 'SALES') {
      // 1. 恢复库存
      if (order.OrderItems && order.OrderItems.length > 0) {
        for (const item of order.OrderItems) {
          // 找到对应的库存项
          const inventory = await Inventory.findOne({
            where: { 
              material: item.material,
              specification: item.specification
            }
          }, { transaction: t });
          
          if (inventory) {
            // 计算新库存数量
            const newQuantity = parseFloat(inventory.quantity) + parseFloat(item.quantity || 0);
            // 更新库存
            await inventory.update({ quantity: newQuantity }, { transaction: t });
            console.log(`Restored inventory for ${item.material} (${item.specification}): +${item.quantity}`);
          }
        }
      }
      
      // 2. 处理客户欠款
      if (!order.is_paid) {
        const customerId = order.customer_id;
        const orderTotal = parseFloat(order.total_price || 0);
        
        // 获取客户
        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (customer) {
          // 减少客户欠款
          const newDebt = Math.max(0, parseFloat(customer.total_debt || 0) - orderTotal);
          await customer.update({ total_debt: newDebt.toFixed(2) }, { transaction: t });
          console.log(`Updated customer ${customer.name} total_debt: -${orderTotal} = ${newDebt} (order deleted)`);
        }
      }
    }
    
    // 删除订单（关联的OrderItems会通过外键级联删除）
    await order.destroy({ transaction: t });
    
    await t.commit();
    res.json({ success: true, msg: 'Order deleted successfully' });
  } catch (err) {
    await t.rollback();
    console.error('Error deleting order:', err);
    res.status(500).json({ success: false, msg: 'Failed to delete order' });
  }
});

/**
 * PUT /api/orders/:id/edit
 * 编辑订单信息和订单项（需要管理员权限或员工只能编辑自己的订单）
 */
router.put('/:id/edit', employeeOrderAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { customerId, items, remark } = req.body;
    
    // 获取原订单信息
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem }]
    });
    
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }
    
    // 开始数据库事务
    const t = await sequelize.transaction();
    
    try {
      // 获取原始价格用于后续计算
      const originalTotalPrice = parseFloat(order.total_price || 0);
      
      // 1. 更新订单基本信息
      const originalCustomerId = order.customer_id;
      const customerChanged = customerId && customerId !== originalCustomerId;
      
      await order.update({
        customer_id: customerId,
        remark
      }, { transaction: t });
      
      // 2. 处理订单项
      const originalItems = order.OrderItems || [];
      const newItems = items || [];
      
      // 存储所有需要更新库存的信息
      const inventoryUpdates = [];
      
      // 处理每个订单项
      for (const item of newItems) {
        if (item.id) {
          // 更新现有订单项
          const originalItem = originalItems.find(oi => oi.id === item.id);
          if (originalItem) {
            // 如果是销售订单，记录库存变化
            if (order.order_type === 'SALES') {
              // 计算数量差异
              const quantityDiff = parseFloat(item.quantity) - parseFloat(originalItem.quantity);
              
              if (quantityDiff !== 0) {
                inventoryUpdates.push({
                  material: item.material,
                  specification: item.specification,
                  quantityChange: -quantityDiff // 负数表示库存减少
                });
              }
            }
            
            // 更新订单项
            await originalItem.update({
              material: item.material,
              specification: item.specification,
              quantity: item.quantity,
              unit: item.unit,
              weight: item.weight,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              remark: item.remark
            }, { transaction: t });
          }
        } else {
          // 创建新订单项
          await OrderItem.create({
            order_id: orderId,
            material: item.material,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            weight: item.weight,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            remark: item.remark
          }, { transaction: t });
          
          // 如果是销售订单，记录库存减少
          if (order.order_type === 'SALES') {
            inventoryUpdates.push({
              material: item.material,
              specification: item.specification,
              quantityChange: -parseFloat(item.quantity) // 负数表示库存减少
            });
          }
        }
      }
      
      // 3. 删除不再需要的订单项
      const existingItemIds = newItems.filter(item => item.id).map(item => item.id);
      const itemsToDelete = originalItems.filter(item => !existingItemIds.includes(item.id));
      
      for (const item of itemsToDelete) {
        // 如果是销售订单，记录库存增加（删除的项目）
        if (order.order_type === 'SALES') {
          inventoryUpdates.push({
            material: item.material,
            specification: item.specification,
            quantityChange: parseFloat(item.quantity) // 正数表示库存增加
          });
        }
        
        await item.destroy({ transaction: t });
      }
      
      // 4. 更新总金额
      const newTotalPrice = newItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      await order.update({ total_price: newTotalPrice.toFixed(2) }, { transaction: t });
      
      // 5. 更新库存
      for (const update of inventoryUpdates) {
        const inventory = await Inventory.findOne({
          where: { 
            material: update.material, 
            specification: update.specification 
          }
        }, { transaction: t });
        
        if (inventory) {
          const newQuantity = parseFloat(inventory.quantity) + update.quantityChange;
          await inventory.update({ quantity: newQuantity }, { transaction: t });
          console.log(`Updated inventory for ${update.material} (${update.specification}): ${update.quantityChange > 0 ? '+' : ''}${update.quantityChange}`);
        }
      }
      
      // 6. 处理客户欠款更新
      if (order.order_type === 'SALES' && !order.is_paid) {
        // 金额差异
        const priceDifference = newTotalPrice - originalTotalPrice;
        
        if (customerChanged) {
          // 处理客户变更情况：减少原客户欠款，增加新客户欠款
          
          // 减少原客户欠款
          const originalCustomer = await Customer.findByPk(originalCustomerId, { transaction: t });
          if (originalCustomer) {
            const originalNewDebt = Math.max(0, parseFloat(originalCustomer.total_debt || 0) - originalTotalPrice);
            await originalCustomer.update({ total_debt: originalNewDebt.toFixed(2) }, { transaction: t });
            console.log(`Reduced debt for original customer ${originalCustomer.name}: -${originalTotalPrice} = ${originalNewDebt}`);
          }
          
          // 增加新客户欠款
          const newCustomer = await Customer.findByPk(customerId, { transaction: t });
          if (newCustomer) {
            const newCustomerDebt = parseFloat(newCustomer.total_debt || 0) + newTotalPrice;
            await newCustomer.update({ total_debt: newCustomerDebt.toFixed(2) }, { transaction: t });
            console.log(`Added debt to new customer ${newCustomer.name}: +${newTotalPrice} = ${newCustomerDebt}`);
          }
        } else if (priceDifference !== 0) {
          // 如果只是金额变更，更新当前客户欠款
          const customer = await Customer.findByPk(order.customer_id, { transaction: t });
          if (customer) {
            const newDebt = parseFloat(customer.total_debt || 0) + priceDifference;
            await customer.update({ total_debt: Math.max(0, newDebt).toFixed(2) }, { transaction: t });
            console.log(`Updated customer ${customer.name} total_debt: ${priceDifference >= 0 ? '+' : ''}${priceDifference} = ${newDebt}`);
          }
        }
      }
      
      // 提交事务
      await t.commit();
      
      res.json({ 
        success: true, 
        msg: 'Order updated successfully'
      });
    } catch (error) {
      // 回滚事务
      await t.rollback();
      throw error;
    }
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ success: false, msg: 'Failed to update order' });
  }
});

/**
 * GET /api/orders/:id/pdf
 * 生成订单PDF并下载
 */
router.get('/:id/pdf', employeeOrderAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Customer },
        { model: User },
        { model: OrderItem }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    // 准备模板数据
    const templateData = {
      order_number: order.order_number,
      order_type: order.order_type === 'QUOTE' ? 'Quote' : 'Sales',
      is_sales: order.order_type === 'SALES',
      created_at: new Date(order.created_at).toLocaleString(),
      remark: order.remark,
      total_price: order.total_price || order.OrderItems.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0).toFixed(2),
      is_paid: order.is_paid,
      is_completed: order.is_completed,
      Customer: {
        name: order.Customer ? order.Customer.name : '未知客户',
        address: order.Customer ? order.Customer.address : ''
      },
      User: {
        username: order.User ? order.User.username : '未知用户',
        role: order.User ? order.User.role : ''
      },
      order_items: order.OrderItems.map(item => ({
        material: item.material,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit,
        weight: item.weight || '-',
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        remark: item.remark || '-'
      })),
      generated_date: new Date().toLocaleDateString()
    };

    // 使用通用PDF生成工具生成PDF
    const pdfBuffer = await generatePDF(templateData, 'order');
    
    // 发送PDF响应
    sendPDFResponse(res, pdfBuffer, `order-${order.order_number}.pdf`);
  } catch (err) {
    handlePDFError(res, err);
  }
});

/**
 * 生成订单PDF的函数
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Buffer>} - 返回PDF缓冲区
 */
async function generateOrderPDF(orderData) {
  // 使用新的工具函数替换旧的实现
  return await generatePDF(orderData, 'order');
}

export default router;
