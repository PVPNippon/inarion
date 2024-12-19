const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const User = require('./User')

class Project extends Model {}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    projectName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    organizationId: {
      type: DataTypes.STRING,
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
    modelName: 'Project',
    tableName: 'Projects',
    timestamps: true, // Enables automatic createdAt and updatedAt
  }
)

// Define foreign key relationship
Project.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' })

module.exports = Project
