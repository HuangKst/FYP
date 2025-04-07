import authenticate from './index.js';

/**
 * 管理员权限验证中间件
 * 只有管理员和老板可以访问
 */
const adminAuth = (req, res, next) => {
  console.log('🔍 Starting admin auth check...');
  console.log('Request headers:', req.headers);
  
  // 先进行基本身份验证
  authenticate(req, res, () => {
    console.log('🔒 Admin Auth - After basic authentication:');
    console.log('User object:', JSON.stringify(req.user, null, 2));
    console.log('User role:', req.user?.userRole);
    
    // 检查用户角色
    if (req.user && (req.user.userRole === 'admin' || req.user.userRole === 'boss')) {
      console.log('✅ Access granted for role:', req.user.userRole);
      // 用户是管理员或老板，允许访问
      next();
    } else {
      // 用户没有权限
      console.log('❌ Access denied. Required roles: admin or boss, but got:', req.user?.userRole);
      console.log('Full user object:', JSON.stringify(req.user, null, 2));
      res.status(403).json({ 
        success: false, 
        msg: '您没有权限访问此资源，需要管理员或老板权限' 
      });
    }
  });
};

export default adminAuth; 