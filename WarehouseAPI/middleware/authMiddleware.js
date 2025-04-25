import jwt from 'jsonwebtoken';

/**
 * 验证JWT令牌并提取用户信息中间件
 * @param {Request} req - 请求对象
 * @param {Response} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const authMiddleware = (req, res, next) => {
  try {
    // 从Authorization头获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, msg: '未提供授权令牌' });
    }

    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // 将解码后的用户信息添加到请求对象中
    req.user = decoded.user;
    
    next();
  } catch (error) {
    console.error('认证错误:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, msg: '授权令牌已过期' });
    }
    res.status(401).json({ success: false, msg: '无效的授权令牌' });
  }
};

/**
 * 检查用户是否具有指定角色的中间件
 * @param {string[]} roles - 允许访问的角色数组
 * @returns {Function} 中间件函数
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: '需要登录后访问' });
    }

    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        msg: '无权执行此操作，需要更高级别权限' 
      });
    }
    
    next();
  };
};

/**
 * 检查是否有修改库存的权限（非employee角色）
 */
export const checkInventoryPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, msg: '需要登录后访问' });
  }

  const userRole = req.user.role;
  
  // employee角色不能修改库存
  if (userRole === 'employee') {
    return res.status(403).json({ 
      success: false, 
      msg: '无权限执行此操作，需要更高级别权限' 
    });
  }
  
  next();
};

export default {
  authMiddleware,
  checkRole,
  checkInventoryPermission
}; 