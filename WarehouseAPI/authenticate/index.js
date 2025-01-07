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
    const user = await User.findByUserName(decoded.username);

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // 将用户信息附加到请求对象上
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication Error:', err.message);
    res.status(403).json({ success: false, msg: `Verification Failed: ${err.message}` });
  }
};

export default authenticate;
