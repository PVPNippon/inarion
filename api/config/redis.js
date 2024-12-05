// config/redisClient.js
const redis = require('redis')
const logger = require('../logger/logger')(__filename, 'Redis Connection')

// Create a Redis client using environment variables
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
})

// Connect the Redis client
redisClient.connect().catch((err) => {
  logger.error(`Error connecting to Redis:${err}`)
})

// Event listeners to monitor the Redis connection status
redisClient.on('connect', () => {
  logger.info('Connected to Redis successfully!')
})

redisClient.on('error', (err) => {
  logger.error(`Redis error:${err}`)
})

// Export the Redis client for use in other files
module.exports = redisClient

// Strucure of individual items stored inside redis
//
// [
//   {
//       "parentId": "0AOv92gz8GfyoUk9PVA",
//       "id": "1B_EBXvREdXFmydWCI6mPN",
//       "name": "Zaffy Doc",
//       "isStoredIn": "my-drive-a.mason@pvp.co.jp",   // for shared drive name of SD
//       "type": "document",
//       "owner": "dev@zaffy.pvp.co.jp",
//       "sharedExternally": "no",
//       "trashed": "no",
//       "sharedWith": ["a.mason@", "sap@", "raj@”],
//       "linkSharing": "domain restricted / anyone with link / specific group",
//       "fileSize": "37 KB",
//       "pathToRootFolder": "my-drive-a.mason@pvp.co.jp/Projects/Documentation/Zaffy Doc",
//       "depth": 2,
//       "itemsContainedInside": 0,   // since it's a file
//       "lastModified": "2024-08-21T05:28:20.356Z"
//   }
// ]
