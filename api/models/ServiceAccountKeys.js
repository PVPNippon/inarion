const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const ServiceAccount = require('./ServiceAccount')

class ServiceAccountKeys extends Model {}

ServiceAccountKeys.init(
  {
    privateKeyId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    privateKeyData: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    validAfterTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validBeforeTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    serviceAccountEmail: {
      // Changed this from serviceAccountId to serviceAccountEmail
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'ServiceAccounts',
        key: 'serviceAccountEmail',
      },
    },
  },
  {
    sequelize,
    modelName: 'ServiceAccountKeys',
    tableName: 'ServiceAccountKeys',
  }
)

ServiceAccountKeys.belongsTo(ServiceAccount, {
  foreignKey: 'serviceAccountEmail',
  targetKey: 'serviceAccountEmail',
  onDelete: 'CASCADE',
})

module.exports = ServiceAccountKeys
