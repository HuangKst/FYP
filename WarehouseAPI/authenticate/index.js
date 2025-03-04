import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, msg: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, msg: 'Bearer token not found' });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    console.log('✅ Decoded JWT:', decoded);  // 先检查 JWT 是否正确解析

    // **🚀 修正这里**
    const user = await User.findOne({ where: { username: decoded.username } });

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // ✅ 记录成功找到的用户
    console.log('✅ Authenticated User:', user.username);

    // **附加用户信息到请求对象**
    req.user = user;

    next();
  } catch (err) {
    console.error('Authentication Error:', err.message);
    res.status(403).json({ success: false, msg: `Verification Failed: ${err.message}` });
  }
};

export default authenticate;
