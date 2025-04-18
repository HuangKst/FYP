/**
 * @route GET /api/customers/:id/orders/all
 * @desc 获取客户的所有订单（不分页）用于导出
 * @access Private
 */
router.get('/:id/orders/all', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderType, isPaid, isCompleted, orderNumber } = req.query;
    
    let filterOptions = { customerId: id };
    
    if (orderType) {
      filterOptions.orderType = orderType;
    }
    
    if (isPaid !== undefined) {
      filterOptions.isPaid = isPaid === 'true';
    }
    
    if (isCompleted !== undefined) {
      filterOptions.isCompleted = isCompleted === 'true';
    }
    
    if (orderNumber) {
      filterOptions.orderNumber = { $regex: orderNumber, $options: 'i' };
    }
    
    // 查找所有匹配的订单
    const orders = await Order.find(filterOptions)
      .sort({ createdAt: -1 })
      .populate('customerId', 'name phone');
      
    return res.json({ success: true, data: orders });
  } catch (error) {
    console.error('获取客户所有订单失败:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
}); 