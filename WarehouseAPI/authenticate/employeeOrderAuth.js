/**
 * 员工订单权限验证中间件
 * 确保员工用户只能访问自己创建的订单
 */
import Order from '../Models/orderModel.js';

const employeeOrderAuth = async (req, res, next) => {
  console.log('🔍 Starting employee order auth check...');
  
  try {
    // 检查用户是否已认证
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        msg: '请先登录' 
      });
    }

    // 如果用户是管理员或老板，直接通过
    if (req.user.userRole === 'admin' || req.user.userRole === 'boss') {
      console.log('✅ Admin/Boss access granted, bypassing employee check');
      return next();
    }

    // 如果不是员工角色，也不是管理员/老板，拒绝访问
    if (req.user.userRole !== 'employee') {
      console.log('❌ Access denied. Unknown role:', req.user.userRole);
      return res.status(403).json({ 
        success: false, 
        msg: '您没有权限访问此资源' 
      });
    }

    // 对于员工角色，检查订单ID是否存在
    const orderId = req.params.id;
    if (!orderId) {
      console.log('❌ No order ID provided in request params');
      return res.status(400).json({ 
        success: false, 
        msg: '未提供订单ID' 
      });
    }

    // 查询订单并检查是否由当前用户创建
    const order = await Order.findByPk(orderId);
    
    // 如果订单不存在
    if (!order) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ 
        success: false, 
        msg: '订单不存在' 
      });
    }

    // 检查订单是否由当前员工创建
    if (order.user_id !== req.user.userId) {
      console.log(`❌ Access denied. Order ${orderId} belongs to user ${order.user_id}, not to employee ${req.user.userId}`);
      return res.status(403).json({ 
        success: false, 
        msg: '您只能访问自己创建的订单' 
      });
    }

    // 验证通过，允许访问
    console.log(`✅ Employee access granted for their own order: ${orderId}`);
    next();
  } catch (error) {
    console.error('Error in employee order auth middleware:', error);
    res.status(500).json({ 
      success: false, 
      msg: '服务器内部错误' 
    });
  }
};

export default employeeOrderAuth; 