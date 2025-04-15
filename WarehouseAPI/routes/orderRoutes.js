import express from 'express';
import Order from '../Models/orderModel.js';
import OrderItem from '../Models/orderItemModel.js';
import Customer from '../Models/customerModel.js';
import User from '../Models/userModel.js';
import Inventory from '../Models/inventoryModel.js';
import { Op } from 'sequelize';
import { sequelize } from '../db/index.js';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateOrderTemplate } from '../templates/orderPDFTemplate.js';

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
    if (!user || (user.userRole !== 'admin' && user.userRole !== 'superadmin')) {
      return res.status(403).json({ 
        success: false, 
        msg: 'Permission denied. Only administrators can delete orders.' 
      });
    }
    
    // 在删除前先获取订单信息和订单项目
    const orderId = req.params.id;
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem }]
    });
    
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }
    
    // 如果是销售订单，恢复库存
    if (order.order_type === 'SALES' && order.OrderItems && order.OrderItems.length > 0) {
      for (const item of order.OrderItems) {
        // 找到对应的库存项
        const inventory = await Inventory.findOne({
          where: { 
            material: item.material,
            specification: item.specification
          }
        });
        
        if (inventory) {
          // 计算新库存数量
          const newQuantity = parseFloat(inventory.quantity) + parseFloat(item.quantity || 0);
          // 更新库存
          await inventory.update({ quantity: newQuantity });
          console.log(`Restored inventory for ${item.material} (${item.specification}): +${item.quantity}`);
        }
      }
    }
    
    // 删除订单（关联的OrderItems会通过外键级联删除）
    await order.destroy();
    
    res.json({ success: true, msg: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ success: false, msg: 'Failed to delete order' });
  }
});

/**
 * PUT /api/orders/:id/edit
 * 编辑订单信息和订单项（需要管理员权限）
 */
router.put('/:id/edit', async (req, res) => {
  try {
    // 检查用户权限
    const user = req.user;
    
    // 如果没有用户信息或用户角色不是admin/boss，拒绝操作
    if (!user || (user.userRole !== 'admin' && user.userRole !== 'boss')) {
      return res.status(403).json({ 
        success: false, 
        msg: 'Permission denied. Only administrators can edit orders.' 
      });
    }
    
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
      // 1. 更新订单基本信息
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
      const totalPrice = newItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      await order.update({ total_price: totalPrice.toFixed(2) }, { transaction: t });
      
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
router.get('/:id/pdf', async (req, res) => {
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

    // 生成PDF
    const pdfBuffer = await generateOrderPDF(templateData);

    // 设置响应头并发送PDF - 确保正确的MIME类型和编码
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="order-${order.order_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer, 'binary');
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ success: false, msg: 'Failed to generate PDF', error: err.message });
  }
});

/**
 * 生成订单PDF的函数
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Buffer>} - 返回PDF缓冲区
 */
async function generateOrderPDF(orderData) {
  let browser = null;
  try {
    console.log('开始生成PDF...');

    // 从模板函数获取HTML
    const templateHtml = generateOrderTemplate(orderData);
    console.log('HTML模板已创建');

    // 更改Puppeteer配置 - 使用最稳定的设置
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
      timeout: 60000 // 增加超时时间
    };
    
    console.log('正在启动Puppeteer浏览器...');
    browser = await puppeteer.launch(puppeteerOptions);
    
    console.log('正在创建新页面...');
    const page = await browser.newPage();
    
    // 设置视口大小为A4
    await page.setViewport({
      width: 794, // A4宽度对应像素(72dpi)
      height: 1123, // A4高度对应像素
      deviceScaleFactor: 1
    });
    
    // 设置页面内容 - 使用更可靠的等待策略
    console.log('正在设置页面内容...');
    await page.setContent(templateHtml, { 
      waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
      timeout: 30000
    });
    
    // 确保所有字体已加载
    await page.evaluate(() => document.fonts.ready);
    
    // 设置打印媒体类型
    await page.emulateMediaType('print');
    
    // 生成PDF - 使用标准PDF设置
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
    // 确保浏览器实例被关闭
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
