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
  price_per_kg: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  }
}, {
  sequelize,
  modelName: 'DailyMaterialPrice',
  tableName: 'daily_material_price',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default DailyMaterialPrice;
