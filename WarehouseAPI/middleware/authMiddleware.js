import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate JWT token and extract user info
 * @param {Request} req - request object
 * @param {Response} res - response object
 * @param {Function} next - next middleware function
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, msg: 'Authorization token not provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET);
    
    // Attach decoded user info to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, msg: 'Authorization token has expired' });
    }
    res.status(401).json({ success: false, msg: 'Invalid authorization token' });
  }
};

/**
 * Middleware to check if user has one of the allowed roles
 * @param {string[]} roles - allowed roles array
 * @returns {Function} middleware function
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: 'Authentication required' });
    }

    const userRole = req.user.userRole;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        msg: 'Forbidden: insufficient privileges' 
      });
    }
    
    next();
  };
};

/**
 * Middleware to check inventory modification permission (non-employee roles only)
 */
export const checkInventoryPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, msg: 'Authentication required' });
  }

  const userRole = req.user.userRole;
  
  // employee角色不能修改库存
  if (userRole === 'employee') {
    return res.status(403).json({ 
      success: false, 
      msg: 'Forbidden: insufficient privileges to perform this action' 
    });
  }
  
  next();
};

export default {
  authMiddleware,
  checkRole,
  checkInventoryPermission
}; 