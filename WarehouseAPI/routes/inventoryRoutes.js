import express from 'express';
import Inventory from '../Models/inventoryModel.js';
import{Op,Sequelize} from 'sequelize';
import { sequelize } from '../db/index.js';
import ExcelJS from 'exceljs';
import authenticate from '../authenticate/index.js';

const router = express.Router();

/**
 * GET /api/inventory
 * 查询库存 (可加筛选: material=?, specification=?)
 */
router.get('/',async (req, res) => {
  try {
    const { material, spec,lowStock } = req.query;
    const where = {};
    if (material) where.material = material;
    if (spec) where.specification = { [Op.like]: `%${spec}%` };
    if (lowStock === 'true') where.quantity = { [Op.lt]: 50 }; // 低于 50 触发预警

    const list = await Inventory.findAll({ where, order: [['specification','ASC']] });
    res.json({ success: true, inventory: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch inventory' });
  }
});

/**
 * GET /api/inventory/materials
 * 获取所有独特的材质
 */
router.get('/materials',async (req, res) => {
  try {
    const materials = await Inventory.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('material')), 'material']],
      order: [['material', 'ASC']]
    });
    res.json({ success: true, materials: materials.map((m) => m.material) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch materials' });
  }
});


/**
 * POST /api/inventory
 * 单独添加材料(材质, 规格, 数量, 比重)
 */
router.post('/',async (req, res) => {
  try {
    const { material, specification, quantity, density } = req.body;
    // Check if the same material+spec already exists
    let inv = await Inventory.findOne({ where: { material, specification } });
    if (inv) {
      // Accumulate?
      const newQty = (parseFloat(inv.quantity) + parseFloat(quantity)).toFixed(2);
      await inv.update({ quantity: newQty, density: density || inv.density });
      return res.json({ success: true, msg: 'Inventory updated successfully', inventory: inv });
    } else {
      const newInv = await Inventory.create({ material, specification, quantity, density });
      return res.status(201).json({ success: true, inventory: newInv });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to add inventory' });
  }
});

/**
 * PUT /api/inventory/:id
 * 修改库存(数量,比重)
 */
router.put('/:id',async (req, res) => {
  try {
    const { quantity, density } = req.body;
    const [count] = await Inventory.update({ quantity, density }, { where: { id: req.params.id } });
    if (count === 0) return res.status(404).json({ success: false, msg: 'Record not found' });
    res.json({ success: true, msg: 'Inventory updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to update inventory' });
  }
});

/**
 * POST /api/inventory/import
 * 接收前端解析好的库存数据并存储到数据库
 */
router.post('/import',async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { inventory } = req.body; // 从前端接收解析好的数据

    if (!inventory || !Array.isArray(inventory)) {
      return res.status(400).json({ success: false, msg: 'Invalid inventory data' });
    }

    for (const item of inventory) {
      const { material, specification, quantity, density } = item;

      if (!material || !specification || !quantity) {
        continue; // 跳过缺少必要字段的记录
      }

      const existingItem = await Inventory.findOne({ where: { material, specification } });

      if (existingItem) {
        // 如果存在相同的材质和规格，更新数量和比重
        const newQuantity = (parseFloat(existingItem.quantity) + parseFloat(quantity)).toFixed(2);
        await existingItem.update({ quantity: newQuantity, density: density || existingItem.density });
      } else {
        // 如果不存在，创建新记录
        await Inventory.create({ material, specification, quantity, density });
      }
    }
    await transaction.commit(); // 提交事务
    res.json({ success: true, msg: 'Inventory imported successfully' });
  } catch (err) {
    await transaction.rollback(); // 回滚事务
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to import inventory' });
  }
});


// 导出库存到Excel
router.get('/export', async (req, res) => {
  try {
    const data = await Inventory.findAll({
      order: [['material', 'ASC'], ['specification', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // 设置表头（需要与数据库字段对应）
    worksheet.columns = [
      { header: 'Material', key: 'material', width: 20 },
      { header: 'Specification', key: 'specification', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Density', key: 'density', width: 15 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 }
    ];

    // 填充数据
    data.forEach(item => {
      worksheet.addRow({
        material: item.material,
        specification: item.specification,
        quantity: item.quantity,
        density: item.density,
        created_at: item.created_at,
        updated_at: item.updated_at
      });
    });

    // 设置响应头
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="inventory_export.xlsx"'
    );

    // 发送文件流
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export failed:', err);
    res.status(500).json({ success: false, msg: 'Export failed' });
  }
});

export default router;