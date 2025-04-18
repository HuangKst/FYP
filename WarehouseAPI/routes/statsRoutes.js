import express from 'express';
import Order from '../Models/orderModel.js';
import Inventory from '../Models/inventoryModel.js';
import Customer from '../Models/customerModel.js';
import Employee from '../Models/employeeModel.js';
import { Op, Sequelize } from 'sequelize';

const router = express.Router();

/**
 * GET /api/stats/dashboard
 * Get all dashboard statistics in a single API call
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get the current date and calculate the start of current month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate the start of previous month
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Get order statistics
    const totalOrders = await Order.count();
    const previousMonthOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: previousMonth,
          [Op.lt]: currentMonth
        }
      }
    });
    const currentMonthOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: currentMonth
        }
      }
    });

    // Get inventory statistics
    const totalInventory = await Inventory.sum('quantity');
    const newInventoryItems = await Inventory.count({
      where: {
        created_at: {
          [Op.gte]: currentMonth
        }
      }
    });

    // Get customer statistics
    const totalCustomers = await Customer.count();
    const newCustomers = await Customer.count({
      where: {
        created_at: {
          [Op.gte]: currentMonth
        }
      }
    });

    // Get employee statistics
    const totalEmployees = await Employee.count();
    const newEmployees = await Employee.count({
      where: {
        hire_date: {
          [Op.gte]: currentMonth
        }
      }
    });

    // Create the response object
    const responseData = {
      orders: {
        total: totalOrders,
        previousMonth: previousMonthOrders,
        currentMonth: currentMonthOrders
      },
      inventory: {
        total: totalInventory || 0,
        newItems: newInventoryItems
      },
      customers: {
        total: totalCustomers,
        newCustomers: newCustomers
      },
      employees: {
        total: totalEmployees,
        newEmployees: newEmployees
      }
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/stats/orders
 * Get order statistics
 */
router.get('/orders', async (req, res) => {
  try {
    // Get the current date and calculate the start of current month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate the start of previous month
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Get order statistics
    const totalOrders = await Order.count();
    const previousMonthOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: previousMonth,
          [Op.lt]: currentMonth
        }
      }
    });
    const currentMonthOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: currentMonth
        }
      }
    });
    
    // Calculate growth percentage if possible
    let growth = 0;
    if (previousMonthOrders > 0) {
      growth = ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100;
    }
    
    res.json({
      success: true,
      data: {
        total: totalOrders,
        previousMonth: previousMonthOrders,
        currentMonth: currentMonthOrders,
        growth: growth
      }
    });
  } catch (err) {
    console.error('Error fetching order statistics:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch order statistics' });
  }
});

/**
 * GET /api/stats/inventory
 * Get inventory statistics
 */
router.get('/inventory', async (req, res) => {
  try {
    // Get the current date and calculate the start of current month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get inventory statistics
    const totalInventory = await Inventory.sum('quantity');
    const newInventoryItems = await Inventory.count({
      where: {
        created_at: {
          [Op.gte]: currentMonth
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        total: totalInventory || 0,
        newItems: newInventoryItems
      }
    });
  } catch (err) {
    console.error('Error fetching inventory statistics:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch inventory statistics' });
  }
});

/**
 * GET /api/stats/customers
 * Get customer statistics
 */
router.get('/customers', async (req, res) => {
  try {
    // Get the current date and calculate the start of current month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get customer statistics
    const totalCustomers = await Customer.count();
    const newCustomers = await Customer.count({
      where: {
        created_at: {
          [Op.gte]: currentMonth
        }
      }
    });
    
    // Calculate growth percentage if possible
    let growth = 0;
    if (totalCustomers > 0) {
      growth = (newCustomers / (totalCustomers - newCustomers)) * 100;
    }
    
    res.json({
      success: true,
      data: {
        total: totalCustomers,
        newCustomers: newCustomers,
        growth: growth
      }
    });
  } catch (err) {
    console.error('Error fetching customer statistics:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch customer statistics' });
  }
});

/**
 * GET /api/stats/employees
 * Get employee statistics
 */
router.get('/employees', async (req, res) => {
  try {
    // Get the current date and calculate the start of current month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get employee statistics
    const totalEmployees = await Employee.count();
    const newEmployees = await Employee.count({
      where: {
        hire_date: {
          [Op.gte]: currentMonth
        }
      }
    });
    
    // Calculate growth percentage if possible
    let growth = 0;
    if (totalEmployees > 0) {
      growth = (newEmployees / (totalEmployees - newEmployees)) * 100;
    }
    
    res.json({
      success: true,
      data: {
        total: totalEmployees,
        newEmployees: newEmployees,
        growth: growth
      }
    });
  } catch (err) {
    console.error('Error fetching employee statistics:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch employee statistics' });
  }
});

/**
 * GET /api/stats/sales
 * Get sales statistics by time period (weekly, monthly, quarterly)
 */
router.get('/sales', async (req, res) => {
  try {
    const { period = 'monthly', year, quarter, month } = req.query;
    
    // 默认使用当前年份，如果未提供
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    console.log(`获取${selectedYear}年销售数据，周期: ${period}`);
    
    // 根据周期构建时间范围查询条件
    let timeRangeCondition = {};
    let groupBy = [];
    let dateFormat = '';
    let labels = [];
    
    // 构建查询条件
    const createTimeCondition = (startDate, endDate) => {
      return {
        created_at: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        },
        order_type: 'SALES' // 只统计销售订单，不包括报价单
      };
    };
    
    // 设置年份范围
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear + 1, 0, 1);
    
    if (period === 'quarterly') {
      // 季度视图 - 按季度分组
      timeRangeCondition = createTimeCondition(yearStart, yearEnd);
      groupBy = [Sequelize.fn('QUARTER', Sequelize.col('created_at'))];
      dateFormat = 'QUARTER';
      labels = ['1', '2', '3', '4'];
    } 
    else if (period === 'monthly') {
      if (quarter) {
        // 如果指定了季度，只查询该季度的月份
        const quarterNum = parseInt(quarter);
        if (quarterNum >= 1 && quarterNum <= 4) {
          const quarterStart = new Date(selectedYear, (quarterNum - 1) * 3, 1);
          const quarterEnd = new Date(selectedYear, quarterNum * 3, 1);
          timeRangeCondition = createTimeCondition(quarterStart, quarterEnd);
          console.log(`查询第${quarterNum}季度数据:`, quarterStart, quarterEnd);
        } else {
          timeRangeCondition = createTimeCondition(yearStart, yearEnd);
        }
      } else {
        // 未指定季度，查询全年
        timeRangeCondition = createTimeCondition(yearStart, yearEnd);
      }
      
      groupBy = [Sequelize.fn('MONTH', Sequelize.col('created_at'))];
      dateFormat = 'MONTH';
      labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    } 
    else if (period === 'weekly') {
      if (month) {
        // 如果指定了月份，只查询该月的周数据
        const monthNum = parseInt(month);
        if (monthNum >= 1 && monthNum <= 12) {
          // 修复：计算当月开始和结束日期
          const monthStart = new Date(selectedYear, monthNum - 1, 1);
          // 使用下个月的第0天来获取当月的最后一天
          const monthEnd = new Date(selectedYear, monthNum, 0);
          // 设置结束时间为当天的23:59:59，确保包含最后一天的数据
          monthEnd.setHours(23, 59, 59, 999);
          timeRangeCondition = createTimeCondition(monthStart, monthEnd);
          console.log(`查询${monthNum}月数据:`, monthStart, monthEnd);
        } else {
          // 默认使用当前月
          const currentMonth = new Date().getMonth() + 1;
          const monthStart = new Date(selectedYear, currentMonth - 1, 1);
          // 修复：计算当月的最后一天
          const monthEnd = new Date(selectedYear, currentMonth, 0);
          monthEnd.setHours(23, 59, 59, 999);
          timeRangeCondition = createTimeCondition(monthStart, monthEnd);
        }
      } else if (quarter) {
        // 如果只指定了季度但未指定月份，使用季度的第一个月
        const quarterNum = parseInt(quarter);
        const monthNum = (quarterNum - 1) * 3 + 1;
        const monthStart = new Date(selectedYear, monthNum - 1, 1);
        // 修复：计算当月的最后一天
        const monthEnd = new Date(selectedYear, monthNum, 0);
        monthEnd.setHours(23, 59, 59, 999);
        timeRangeCondition = createTimeCondition(monthStart, monthEnd);
      } else {
        // 默认使用当前月
        const currentMonth = new Date().getMonth() + 1; // 修正：使用1-12的月份
        const monthStart = new Date(selectedYear, currentMonth - 1, 1);
        // 修复：计算当月的最后一天
        const monthEnd = new Date(selectedYear, currentMonth, 0);
        monthEnd.setHours(23, 59, 59, 999);
        timeRangeCondition = createTimeCondition(monthStart, monthEnd);
      }
      
      // 修改：明确使用DAY函数获取日期，确保查询和分组一致
      groupBy = [Sequelize.fn('DAY', Sequelize.col('created_at'))];
      dateFormat = 'DAY';
      labels = ['W1', 'W2', 'W3', 'W4', 'W5']; // 5周
    }
    
    console.log('查询条件:', timeRangeCondition);
    
    // 执行查询 - 按照指定的分组查询订单总金额
    // 重要：确保SELECT和GROUP BY使用相同的表达式
    const salesData = await Order.findAll({
      attributes: [
        [dateFormat === 'QUARTER' ? 
          Sequelize.fn('QUARTER', Sequelize.col('created_at')) : 
          dateFormat === 'MONTH' ? 
          Sequelize.fn('MONTH', Sequelize.col('created_at')) : 
          Sequelize.fn('DAY', Sequelize.col('created_at')),
        'period'],
        [Sequelize.fn('SUM', Sequelize.col('total_price')), 'totalAmount']
      ],
      where: timeRangeCondition,
      group: groupBy,
      raw: true,
      order: [[Sequelize.col('period'), 'ASC']]
    });
    
    console.log('查询结果:', salesData);
    
    // 转换数据格式以适应前端需要
    const sales = new Array(labels.length).fill(0);
    let totalSales = 0;
    
    salesData.forEach(item => {
      // 根据不同的period类型处理不同的索引映射
      let index;
      
      if (dateFormat === 'DAY') {
        // 将日期按照每7天一周的方式映射到5个周
        const day = parseInt(item.period);
        
        // 优化周映射逻辑
        if (day <= 7) {
          index = 0; // 第1周 (W1)
        } else if (day <= 14) {
          index = 1; // 第2周 (W2)
        } else if (day <= 21) {
          index = 2; // 第3周 (W3)
        } else if (day <= 28) {
          index = 3; // 第4周 (W4)
        } else {
          index = 4; // 第5周 (W5) - 29-31天
        }
      } else if (dateFormat === 'MONTH') {
        // 月份转为0-11的索引
        index = parseInt(item.period) - 1;
      } else {
        // 季度1-4对应索引0-3
        index = parseInt(item.period) - 1;
      }
      
      // 确保索引在有效范围内
      if (index >= 0 && index < sales.length) {
        sales[index] = parseFloat(item.totalAmount) || 0;
        totalSales += sales[index];
      }
    });
    
    // 计算同比增长率（模拟数据）
    const growth = Math.random() * 20 - 5; // -5% 到 15% 之间的随机值
    
    console.log('处理后的销售数据:', {
      period,
      year: selectedYear,
      quarter: quarter || 'all',
      month: month || 'all',
      labels,
      sales,
      totalSales
    });

    // 在时间范围条件处增加日志
    console.log('时间范围条件:', {
      startDate: timeRangeCondition.created_at[Op.gte],
      endDate: timeRangeCondition.created_at[Op.lt],
      dateFormat,
      groupBy: groupBy.map(g => g.fn)
    });
    
    res.json({
      success: true,
      data: {
        labels,
        sales,
        totalSales,
        growth,
        period,
        year: selectedYear
      }
    });
  } catch (err) {
    console.error('获取销售统计时出错:', err);
    res.status(500).json({ success: false, msg: '服务器错误' });
  }
});

export default router; 