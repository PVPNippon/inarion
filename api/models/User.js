const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

class User extends Model {}

User.init(
  {
    googleId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jwtSecret: {
      type: DataTypes.STRING,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    projectName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tokens: {
      type: DataTypes.JSONB,
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
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users', // Match SQL table name explicitly
  }
)

module.exports = User
