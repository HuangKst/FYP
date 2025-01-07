// api/users/index.js
import express from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';


const router = express.Router();

// 获取所有用户 (GET /api/users)
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.status(200).json(users);
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
    // 你也可以把其他情况都归为一个通用提示
    return res
      .status(403)
      .json({ success: false, msg: 'Your account is unavailable.' });
  }

  // 4. 若状态为 active，则生成 token 并返回
  const token = jwt.sign(
    { username: user.username, userId: user.id },
    process.env.SECRET
  );
  return res.status(200).json({
    success: true,
    token:  token,
    user: { userId: user.id,
      username:user.username,
       userStatus:user.status, 
       userRole:user.role }
  });
}


export default router;
