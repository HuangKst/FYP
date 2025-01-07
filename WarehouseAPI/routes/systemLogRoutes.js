import express from 'express';
import SystemLog from '../Models/systemLogModel.js';

const router = express.Router();

/**
 * GET /api/system-logs
 * 查询所有日志，或根据 user_id 或 operation_type 进行筛选
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, operation_type } = req.query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (operation_type) where.operation_type = operation_type;

    const logs = await SystemLog.findAll({ where, order: [['id','DESC']] });
    res.json({ success: true, logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to retrieve logs.' });
  }
});

/**
 * POST /api/system-logs
 * 创建日志记录
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, operation_type, description } = req.body;
    if (!user_id || !operation_type) {
      return res.status(400).json({ success: false, msg: 'user_id 和 operation_type 为必填项.' });
    }
    const newLog = await SystemLog.create({ user_id, operation_type, description });
    res.status(201).json({ success: true, log: newLog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to create log.' });
  }
});

export default router;
