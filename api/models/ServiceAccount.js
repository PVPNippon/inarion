/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const Project = require('./Project')

class ServiceAccount extends Model {}

ServiceAccount.init(
  {
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects', // 'projects' refers to table name
        key: 'projectId',
      },
    },
    serviceAccountEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING,
    },
    clientId: {
      type: DataTypes.STRING,
    },
    privateKey: {
      type: DataTypes.TEXT,
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
    modelName: 'ServiceAccount',
    tableName: 'ServiceAccounts',
  }
)

ServiceAccount.belongsTo(Project, { foreignKey: 'projectId', onDelete: 'CASCADE' })

module.exports = ServiceAccount
