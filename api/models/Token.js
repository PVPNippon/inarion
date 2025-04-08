/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const User = require('./User')

class Token extends Model {}

Token.init(
  {
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scope: {
      type: DataTypes.STRING,
    },
    tokenType: {
      type: DataTypes.STRING,
    },
    expiryDate: {
      type: DataTypes.BIGINT,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // 'Users' refers to the table name
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Token',
  }
)

Token.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' })

module.exports = Token
