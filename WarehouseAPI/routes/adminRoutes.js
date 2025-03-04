import express from 'express';
import User from '../Models/userModel.js';
import authenticate from '../authenticate/index.js';
const router = express.Router();

/**
 * GET /api/admin/pending-users
 */
router.get('/pending-users',async (req, res) => {
  try {
    const pendingUsers = await User.findAll({ where: { status: 'pending' } });
    res.json({ success: true, users: pendingUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
});


/**
 * PUT /api/admin/approve-user/:id
 */
router.put('/approve-user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    console.log('Request to approve user:', { userId, status });

    // 校验状态值
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, msg: 'Invalid status value' });
    }

    // 更新用户状态
    const [updateCount] = await User.update(
      { status },
      { where: { id: userId, status: 'pending' } }
    );

    if (updateCount > 0) {
      res.status(200).json({ success: true, msg: 'User status updated successfully.' });
    } else {
      res.status(404).json({ success: false, msg: 'User not found or not pending.' });
    }
  } catch (err) {
    console.error('Error approving user:', err.message);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
});

export default router;
