import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';

class Inventory extends Model {}

Inventory.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  material: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  specification: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  density: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull:true
  }
}, {
  sequelize,
  modelName: 'Inventory',
  tableName: 'inventory',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  // 定义索引
  indexes: [
    {
      unique: true, // 设置为唯一索引
      fields: ['material', 'specification'], // 索引字段
      name: 'material_specification_unique' // 索引名称（可选）
    }
  ]
});

export default Inventory;
