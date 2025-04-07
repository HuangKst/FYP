import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';

const authenticate = async (req, res, next) => {
  try {
    console.log('🔑 Starting basic authentication check...');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({ success: false, msg: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('❌ Bearer token not found');
      return res.status(401).json({ success: false, msg: 'Bearer token not found' });
    }

    console.log('🔑 Verifying token:', token);
    const decoded = jwt.verify(token, process.env.SECRET);
    console.log('✅ Decoded JWT:', JSON.stringify(decoded, null, 2));

    const user = await User.findOne({ where: { username: decoded.username } });
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    console.log('✅ Found user in database:', {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status
    });

    // 确保用户信息包含所有必要字段
    req.user = {
      userId: user.id,
      username: user.username,
      userRole: user.role,
      userStatus: user.status
    };

    console.log('✅ Set req.user:', JSON.stringify(req.user, null, 2));
    next();
  } catch (err) {
    console.error('🚫 Authentication Error:', err.message);
    console.error('Error stack:', err.stack);
    res.status(403).json({ success: false, msg: `Verification Failed: ${err.message}` });
  }
};

export default authenticate;
