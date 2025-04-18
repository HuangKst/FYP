// Models/dailyMaterialPriceModel.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';

class DailyMaterialPrice extends Model {}

DailyMaterialPrice.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  material: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  price_per_ton: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'DailyMaterialPrice',
  tableName: 'daily_material_price',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

export default DailyMaterialPrice;
