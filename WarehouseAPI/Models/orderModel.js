// Models/orderModel.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';
import Customer from './customerModel.js';
import User from './userModel.js';

class Order extends Model {}

Order.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  order_type: {
    type: DataTypes.ENUM('SALES', 'QUOTE'),
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false    // 记录业务员id
  },
  is_completed: {
    type: DataTypes.TINYINT, // 用 TINYINT 代替 BOOLEAN，和数据库一致
    defaultValue: 0
  },
  is_paid: {
    type: DataTypes.TINYINT, // 用 TINYINT 代替 BOOLEAN，和数据库一致
    defaultValue: 0
  },
  customer_id: {
    type: DataTypes.BIGINT, // 记录客户id
    allowNull: false
  },
  remark: {
    type: DataTypes.TEXT
  },
  total_price: {
    type: DataTypes.DECIMAL(10,2), // 总金额
    allowNull: false,
    defaultValue: 0.00 // 默认值为 0.00
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 外键: Order.customer_id -> customers.id
Order.belongsTo(Customer, {
  foreignKey: 'customer_id',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
});

//  外键: Order.user_id -> users.id
Order.belongsTo(User, {
  foreignKey: 'user_id',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
});

Customer.hasMany(Order, { foreignKey: 'customer_id' });
User.hasMany(Order,{foreignKey:'user_id'});

export default Order;
