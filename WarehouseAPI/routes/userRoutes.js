// api/users/index.js
import express from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';
import authenticate from '../authenticate/index.js';
import adminAuth from '../authenticate/adminAuth.js';
import { Op } from 'sequelize';
import { sequelize } from '../db/index.js';
import rateLimit from 'express-rate-limit';
import axios from 'axios';  // 预先导入axios，避免动态导入可能导致的问题

// Define login rate limiter
const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 15 minutes window
  max: 5,                    // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    msg: 'Too many login attempts from this IP, please try again after 1 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

// 获取所有用户 (GET /api/users)
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.status(200).json(users);
}));

// 获取employee角色的用户 (GET /api/users/employees)
router.get('/employees', authenticate, adminAuth, asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 根据当前用户的角色决定返回什么数据
    console.log(`Querying users with currentUserRole=${req.user.userRole}`);
    
    let whereCondition = {};
    
    // 如果是boss角色，可以查看除了自己以外的所有用户
    if (req.user.userRole === 'boss') {
      // 排除当前用户自己
      whereCondition = {
        id: { [Op.ne]: req.user.userId }
      };
      console.log('Boss role: returning all users except self');
    } 
    // 如果是admin角色，只能查看employee角色的用户
    else {
      whereCondition = { role: 'employee' };
      console.log('Admin role: returning only employee users');
    }
    
    // 计算employee用户总数
    const count = await User.count({ where: whereCondition });
    
    console.log(`Found ${count} users matching criteria`);
    
    // 获取分页后的employee用户
    const employees = await User.findAll({
      where: whereCondition,
      attributes: ['id', 'username', 'status', 'role', 'created_at', 'updated_at'],
      limit: pageSize,
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Returning ${employees.length} users for page ${page}`);
    
    return res.status(200).json({
      success: true,
      users: employees,
      pagination: {
        total: count,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      success: false, 
      msg: 'Failed to fetch users: ' + error.message,
      users: []
    });
  }
}));

// 修改用户密码 (PUT /api/users/:id/password)
router.put('/:id/password', authenticate, adminAuth, asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    
    console.log(`Updating password for user ID: ${userId}`);
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Password is required' 
      });
    }
    
    // 验证密码强度
    const { validatePasswordStrength } = await import('../utils/passwordValidator.js');
    const isValid = validatePasswordStrength(password);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        msg: 'Password does not meet strength requirements. It should be at least 8 characters and contain letters, numbers, and special characters.'
      });
    }
    
    // 查找用户
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        msg: 'User not found' 
      });
    }
    
    // 更新密码 - 密码哈希在模型的beforeSave钩子中处理
    user.password = password;
    await user.save();
    
    console.log(`Password updated successfully for user ID: ${userId}`);
    
    return res.status(200).json({
      success: true,
      msg: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    
    if (error.message === 'Password is invalid') {
      return res.status(400).json({
        success: false,
        msg: 'Password does not meet strength requirements'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      msg: 'Failed to update password: ' + error.message
    });
  }
}));

// Register or Login (POST /api/users?action=register / authenticate)
// Apply rate limiting only to login attempts, not registrations
router.post('/', asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, msg: 'Username and password are required.' });
    }

    // Determine if it's registration or login
    if (req.query.action === 'register') {
      await registerUser(req, res);
    } else {
      // Apply rate limiter to login attempts
      loginRateLimiter(req, res, async () => {
        await authenticateUser(req, res);
      });
    }
    
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, msg: 'Internal server error.' });
  }
}));

// 更新用户 (PUT /api/users/:id)
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    // Check if the current user is a boss
    if (req.user.userRole !== 'boss') {
      return res.status(403).json({ 
        success: false, 
        code: 403,
        msg: 'Only boss users can update other users\' roles' 
      });
    }

    // Check if the user exists
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        code: 404,
        msg: 'User not found' 
      });
    }
    
    const userId = req.params.id;
    // 不能直接更新主键id等，你可自行控制
    delete req.body.id;
    delete req.body.created_at;
    delete req.body.updated_at;
    delete req.body.password; // Do not update password through this endpoint

    const [updateCount] = await User.update(
      { ...req.body },
      { where: { id: userId } }
    );

    if (updateCount > 0) {
      res.status(200).json({ code: 200, msg: 'User Updated Successfully' });
    } else {
      res.status(404).json({ code: 404, msg: 'Unable to Update User' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ 
      success: false, 
      code: 500,
      msg: 'Failed to update user: ' + error.message 
    });
  }
}));

//注册用户
async function registerUser(req, res) {
  try {
    const { username, password, role, status } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, msg: 'Username and password are required.' });
    }

    const newUser = await User.create({ username, password, role, status });
    return res
      .status(201)
      .json({ success: true, msg: 'User successfully created.' });
  } catch (err) {
    console.error('Error in registerUser:', err);

    if (err.message === 'Password is invalid') {
      return res
        .status(400)
        .json({ success: false, msg: 'Password does not meet strength requirements. At least 8 characters contain  letters, numbers, and special characters' });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(400)
        .json({ success: false, msg: 'Username or userId already taken.' });
    }

    if (err.name === 'ValidationError') {
      return res
        .status(400)
        .json({ success: false, msg: err.message });
    }

    return res
      .status(500)
      .json({ success: false, msg: 'Internal server error.' });
  }
}

// Login user
async function authenticateUser(req, res) {
  try {
    const LOCK_THRESHOLD = 5;           // Maximum failed attempts before lockout
    const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes lockout duration
    const CAPTCHA_THRESHOLD = 2;        // After this many failed attempts, require CAPTCHA
    
    const { username, password, captchaToken } = req.body;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // 1. Find user
    const user = await User.findByUserName(username);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, msg: 'Authentication failed. User not found.' });
    }

    // 2. Check if account is locked
    if (user.failedLoginAttempts >= LOCK_THRESHOLD && user.lastFailedLoginAt) {
      const timeSinceLastFailure = Date.now() - new Date(user.lastFailedLoginAt).getTime();
      
      if (timeSinceLastFailure < LOCK_DURATION) {
        const minutesLeft = Math.ceil((LOCK_DURATION - timeSinceLastFailure) / 60000);
        return res
          .status(403)
          .json({ 
            success: false, 
            msg: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minutes.` 
          });
      } else {
        // Reset counters if lock duration has passed
        user.failedLoginAttempts = 0;
        await user.save();
      }
    }

    // 3. Check if CAPTCHA is required but not provided
    if (user.failedLoginAttempts >= CAPTCHA_THRESHOLD && !captchaToken) {
      return res.status(400).json({
        success: false,
        msg: 'CAPTCHA verification required',
        requireCaptcha: true,
        attemptsLeft: LOCK_THRESHOLD - user.failedLoginAttempts
      });
    }

    // 4. Validate CAPTCHA if provided
    if (user.failedLoginAttempts >= CAPTCHA_THRESHOLD && captchaToken) {
      try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', captchaToken);
        
        const { data: verifyCaptchaResponse } = await axios.post(verifyUrl, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log('reCAPTCHA verification response:', verifyCaptchaResponse);
        
        if (!verifyCaptchaResponse.success) {
          return res.status(400).json({
            success: false,
            msg: 'CAPTCHA verification failed',
            requireCaptcha: true
          });
        }
      } catch (error) {
        console.error('Error verifying CAPTCHA:', error);
        return res.status(500).json({
          success: false,
          msg: 'Error verifying CAPTCHA',
          requireCaptcha: true
        });
      }
    }

    // 5. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      user.lastFailedLoginAt = new Date();
      await user.save();
      
      return res
        .status(401)
        .json({ 
          success: false, 
          msg: 'Wrong password.',
          attemptsLeft: LOCK_THRESHOLD - user.failedLoginAttempts,
          requireCaptcha: user.failedLoginAttempts >= CAPTCHA_THRESHOLD
        });
    }

    // 6. Check user status
    if (user.status === 'pending') {
      return res
        .status(403)
        .json({ success: false, msg: 'Your account is pending approval.' });
    } else if (user.status === 'inactive') {
      return res
        .status(403)
        .json({ success: false, msg: 'Your account was not approved.' });
    } else if (user.status !== 'active') {
      return res
        .status(403)
        .json({ success: false, msg: 'Your account is unavailable.' });
    }

    // 7. Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lastFailedLoginAt = null;
    await user.save();

    // 8. Generate token and return user information
    const token = jwt.sign(
      { 
        username: user.username, 
        userId: user.id,
        userRole: user.role,
        userStatus: user.status
      },
      process.env.SECRET
    );

    // Return unified user information format
    const userInfo = {
      userId: user.id,
      username: user.username,
      userStatus: user.status,
      userRole: user.role
    };

    return res.status(200).json({
      success: true,
      token: token,
      user: userInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      msg: 'Internal server error during login.' 
    });
  }
}

export default router;
