// api/users/index.js
import express from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';
import authenticate from '../authenticate/index.js';
import adminAuth from '../authenticate/adminAuth.js';


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
    
    // 测试查询是否可以正常工作
    console.log('Querying employee users with role=employee');
    
    // 计算employee用户总数
    const count = await User.count({
      where: { role: 'employee' }
    });
    
    console.log(`Found ${count} employee users`);
    
    // 获取分页后的employee用户
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: ['id', 'username', 'status', 'role', 'created_at', 'updated_at'],
      limit: pageSize,
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Returning ${employees.length} employee users for page ${page}`);
    
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
    console.error('Error fetching employee users:', error);
    return res.status(500).json({ 
      success: false, 
      msg: 'Failed to fetch employee users: ' + error.message,
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

// 注册 or 登录 (POST /api/users?action=register / authenticate)
router.post('/', asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, msg: 'Username and password are required.' });
    }

    // 判断是注册还是登录
    if (req.query.action === 'register') {
      await registerUser(req, res);
    } else {
      await authenticateUser(req, res);
    }
    
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, msg: 'Internal server error.' });
  }
}));

// 更新用户 (PUT /api/users/:id)
router.put('/:id', asyncHandler(async (req, res) => {
  const userId = req.params.id;
  // 不能直接更新主键id等，你可自行控制
  delete req.body.id;
  delete req.body.created_at;
  delete req.body.updated_at;

  const [updateCount] = await User.update(
    { ...req.body },
    { where: { id: userId } }
  );

  if (updateCount > 0) {
    res.status(200).json({ code: 200, msg: 'User Updated Successfully' });
  } else {
    res.status(404).json({ code: 404, msg: 'Unable to Update User' });
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



// 登录用户
async function authenticateUser(req, res) {
  try {
    // 1. 查找用户
    const user = await User.findByUserName(req.body.username);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, msg: 'Authentication failed. User not found.' });
    }

    // 2. 验证密码
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, msg: 'Wrong password.' });
    }

    // 3. 检查用户状态
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

    // 4. 生成 token 并返回用户信息
    const token = jwt.sign(
      { 
        username: user.username, 
        userId: user.id,
        userRole: user.role,  // 添加角色信息到 token
        userStatus: user.status
      },
      process.env.SECRET
    );

    // 返回统一的用户信息格式
    const userInfo = {
      userId: user.id,
      username: user.username,
      userStatus: user.status,
      userRole: user.role  // 使用数据库中的 role 字段
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
