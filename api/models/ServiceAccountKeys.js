const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const User = require('./User')

class Token extends Model {}

Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
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
        model: 'Users', // Table name
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Token',
    tableName: 'Tokens',
    timestamps: false, // Only 'createdAt' is used
  }
)

Token.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' })

module.exports = Token
