const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Project = require('./Project');

class ServiceAccount extends Model {}

ServiceAccount.init({
  serviceAccountEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING
  },
  clientId: {
    type: DataTypes.STRING
  },
  privateKey: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ServiceAccount'
});

ServiceAccount.belongsTo(Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });

module.exports = ServiceAccount;
