import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';

class Customer extends Model {}

Customer.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(50)
  },
  address: {
    type: DataTypes.STRING(255)
  },
  remark: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'Customer',
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Customer;