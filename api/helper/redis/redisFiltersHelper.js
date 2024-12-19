const config = require('../../config/config.js')
const { storeDataInCache } = require('../../controllers/cacheController.js')
const { createRedisKey } = require('../../utility/utilityFunctions.js')

/**
 * Processes a single file and updates filters directly in Redis.
 * @param {Object} file - The file object.
 */
const createOrUpdateFiltersForFile = async (file, redisTransaction) => {
  try {
    let commonFilter = createRedisKey(config.DOMAIN_TEST, config.FILTERS)
    let dataType = config.SETS

    if (!redisTransaction) {
      logger.debug('Redis Transaction client not provided to createOrUpdateFiltersForFile function')
      return
    }

    // Trashed filter
    await storeDataInCache(
      createRedisKey(commonFilter, config.TRASHED, file.trashed),
      file.id,
      dataType,
      redisTransaction
    )

    // Type filter
    await storeDataInCache(createRedisKey(commonFilter, config.TYPE, file.type), file.id, dataType, redisTransaction)

    // Owner filter
    await storeDataInCache(createRedisKey(commonFilter, config.OWNER, file.owner), file.id, dataType, redisTransaction)

    // Shared-with filter
    if (file.sharedWith) {
      for (const user of file.sharedWith) {
        if (user.email) {
          await storeDataInCache(
            createRedisKey(commonFilter, config.SHARED_WITH, user.email),
            file.id,
            dataType,
            redisTransaction
          )
        }
      }
    }

    // General access filter
    await storeDataInCache(
      createRedisKey(commonFilter, config.GENERAL_ACCESS, file.generalAccessType),
      file.id,
      dataType,
      redisTransaction
    )
  } catch (err) {
    logger.error('Error updating filters for file:', err)
    throw err
  }
}

module.exports = { createOrUpdateFiltersForFile }
