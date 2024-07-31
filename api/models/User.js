const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init({
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  projectName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tokens: {
    type: DataTypes.JSONB, // Storing tokens as JSONB
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'User',
});

module.exports = User;
