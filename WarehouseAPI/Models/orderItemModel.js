// Models/orderItemModel.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';
import Order from './orderModel.js';

class OrderItem extends Model {}

OrderItem.init({
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
  unit: {
    type: DataTypes.STRING(50),
    defaultValue: 'piece'
  },
  weight: {
    type: DataTypes.DECIMAL(15, 3)
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull:false,
    defaultValue: 0.00
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull:false,
    defaultValue: 0.00
  },
  remark: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'OrderItem',
  tableName: 'order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 外键: OrderItem.order_id -> Order.id
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

Order.hasMany(OrderItem, { foreignKey: 'order_id' });

export default OrderItem;
