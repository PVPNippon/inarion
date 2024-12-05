const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

class Logs extends Model {}

Logs.init(
  {
    userIp: {
      types: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userDomain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Logs',
    tableName: 'Logs',
  }
)

module.exports = Logs
