const { Sequelize } = require('sequelize')
require('dotenv').config()
const logger = require('../logger')(__filename, 'Database Connection')

const sequelize = new Sequelize(process.env.POSTGRES_DB, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg), // Set to true if we wanna see the SQL queries
})

const env = process.env.NODE_ENV

// Import models
// const User = require('../models/User');
// const Token = require('../models/Token');

// // Establish associations
// User.hasMany(Token, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Token.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

// await sequelize.sync({ force: true });

// Testing database connection
sequelize
  .authenticate()
  .then(() => {
    logger.info(`Connection has been established successfully. ${env} mode`)
  })
  .catch((err) => {
    logger.error(`Unable to connect to the database:${err}`)
  })

module.exports = sequelize
