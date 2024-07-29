const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

class Token extends Model {}

Token.init({
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scope: {
    type: DataTypes.STRING
  },
  tokenType: {
    type: DataTypes.STRING
  },
  expiryDate: {
    type: DataTypes.BIGINT
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Token'
});

Token.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = Token;
