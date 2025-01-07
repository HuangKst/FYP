import express from 'express';
import Inventory from '../Models/inventoryModel.js';

const router = express.Router();

/**
 * GET /api/inventory
 * 查询库存 (可加筛选: material=?, specification=?)
 */
router.get('/', async (req, res) => {
  try {
    const { material, spec } = req.query;
    const where = {};
    if (material) where.material = material;
    if (spec) where.specification = spec; // Fuzzy search? or { [Op.like]: `%${spec}%` }

    const list = await Inventory.findAll({ where, order: [['specification','ASC']] });
    res.json({ success: true, inventory: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch inventory' });
  }
});

/**
 * POST /api/inventory
 * 单独添加材料(材质, 规格, 数量, 比重)
 */
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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

//TODO
/*
 * 导入excel
 */

export default router;