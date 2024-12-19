const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const Project = require('./Project')

class ServiceAccount extends Model {}

ServiceAccount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.STRING, // Matches "Projects"."projectId"
      allowNull: false,
      references: {
        model: 'Projects', // Explicit table name
        key: 'projectId',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    timestamps: true, // Enable automatic createdAt and updatedAt
  }
)

ServiceAccount.belongsTo(Project, {
  foreignKey: 'projectId',
  targetKey: 'projectId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

module.exports = ServiceAccount
