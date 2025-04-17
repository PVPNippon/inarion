/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

// config/redisClient.js
const redis = require('redis')
const config = require('./config.js')
const logger = require('../logger/logger.js')(__filename, 'Redis')

// Create a Redis client using environment variables
const redisClient = redis.createClient({
  url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,

  // the following works too, another way of creating the client
  // socket: {
  //   host: config.REDIS_HOST,
  //   port: config.REDIS_PORT,
  // },
})

// Connect the Redis client
redisClient.connect().catch((err) => {
  logger.error(err)
})

// Event listeners to monitor the Redis connection status
redisClient.on('connect', () => {
  logger.info('Connected to Redis successfully!')
})

redisClient.on('error', (err) => {
  logger.error(err)
})

// Export the Redis client for use in other files
module.exports = redisClient
