const config = require('../config/config')
const {
  fetchDataFromCache,
  storeDataInCache,
  fetchCommonItemsAcrossSets,
  fetchMultipleKeysFromCache,
} = require('../controllers/cacheController')
const { createOrUpdateFiltersForFile } = require('../helper/redis/redisFiltersHelper')
const populateDataModel = require('../models/redisDriveItem')
const { generateTransaction, executeTransaction } = require('../services/redisCacheService')
const { createRedisKey } = require('../utility/utilityFunctions')
const logger = require('../logger/logger')(__filename, 'Cache Middleware')

/**
 * Middleware to store Google Drive data and filters in Redis cache.
 *
 * This function stores hierarchical data of shared and personal drives along with
 * the combined list of drive files in the Redis cache. If filters are provided,
 * it fetches filtered data and updates the response object (`res.locals.data`).
 * Proceeds to the next middleware on successful execution or handles errors if any.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express middleware function to proceed to the next step.
 */
const storeDriveDataInCache = async (req, res, next) => {
  try {
    // If data is already stored in the response locals, skip this middleware
    if (res.locals.data) {
      return next()
    }

    // Store shared and personal drive hierarchies and filter data in the cache
    await storeDriveHierarchyAndFiltersInCache(res.locals.sharedDrivesList, true) // true = shared drives
    await storeDriveHierarchyAndFiltersInCache(res.locals.personalDrivesList, false) // false = personal drives

    // Combine shared and personal drives into one list
    const driveFilesList = [...res.locals.sharedDrivesList, ...res.locals.personalDrivesList]

    // Store the combined drive data in the cache as JSON
    await storeDataInCache({
      key: createRedisKey(config.DOMAIN_TEST, config.ALL_DRIVES_DATA),
      data: driveFilesList,
      dataType: config.JSON,
    })

    // const { count, ...filters } = res.locals // Extract filters from response locals
    const { filters } = res.locals // Extract filters from response locals

    // If filters exist, fetch filtered data and store it in res.locals.data
    if (Object.keys(filters).length > 0) {
      const fetchedFilteredData = await fetchFiltersFromCache(filters)
      res.locals.data = fetchedFilteredData
    } else {
      // // If no filters are provided, fetch invidual item information and it store it in res.locals.data
      // const { allItemsData } = await fetchAllItemsFromCache(count)
      // res.locals.data = allItemsData

      // If no filters are provided, store the full drive file list in res.locals.data
      res.locals.data = driveFilesList
    }

    // Proceed to the next middleware
    next()
  } catch (error) {
    // Log the error and send a 500 response if an exception occurs
    logger.error('Error faced in cache middleware, unable to store data in Redis', error.message)
    return res.status(500).json({
      message: 'Error faced in cache middleware, unable to store data in Redis',
      error: error.message,
    })
  }
}

/**
 * Middleware to store the entire drive structure in Redis cache.
 * This function checks if the drive structure data is already available in `res.locals.data`,
 * and if not, it stores the hierarchical structure and file count in Redis for quick retrieval.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} - Calls `next()` on success or sends a 500 response on failure
 */
const storeEntireDriveStructureInCache = async (req, res, next) => {
  try {
    // If data is already stored in response locals, skip this middleware
    if (res.locals.data) {
      return next()
    }

    const { id, personalDrive, driveStructure, fileCount } = res.locals

    // Generate Redis keys for file count and drive structure storage
    const redisKeyFileCount = personalDrive
      ? createRedisKey(config.DOMAIN_TEST, config.DRIVE_STRUCTURE, config.PERSONAL_DRIVE, id, config.FILE_COUNT)
      : createRedisKey(config.DOMAIN_TEST, config.DRIVE_STRUCTURE, config.SHARED_DRIVE, id, config.FILE_COUNT)

    const redisKeyDriveStructure = personalDrive
      ? createRedisKey(config.DOMAIN_TEST, config.DRIVE_STRUCTURE, config.PERSONAL_DRIVE, id, config.INFO)
      : createRedisKey(config.DOMAIN_TEST, config.DRIVE_STRUCTURE, config.SHARED_DRIVE, id, config.INFO)

    // Store the file count in Redis as a string
    await storeDataInCache({
      key: redisKeyFileCount,
      data: String(fileCount),
      dataType: config.STRING,
    })

    // Store the drive's hierarchical structure in Redis as JSON
    await storeDataInCache({
      key: redisKeyDriveStructure,
      data: driveStructure,
      dataType: config.JSON,
    })

    res.locals.data = driveStructure
    next()
  } catch (error) {
    // Log the error and send a 500 response if an exception occurs
    logger.error('Error faced in cache middleware, unable to store data in Redis', error.message)
    return res.status(500).json({
      message: 'Error faced in cache middleware, unable to store data in Redis',
      error: error.message,
    })
  }
}

/**
 * Middleware to store the direct path from a file or folder to the root folder in Redis cache.
 * If the direct path is already available in `res.locals.data`, it skips caching.
 * Otherwise, it caches the direct path for future use.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} - Calls `next()` on success or sends a 500 response if no direct path is available
 */
const storeDirectPathToRootFolderInCache = async (req, res, next) => {
  try {
    // If data is already stored in response locals, skip this middleware
    if (res.locals.data) {
      return next()
    }

    // Ensure direct path data is available before caching
    if (!res.locals.directPath || res.locals.directPath.length === 0) {
      return res.status(500).json({ message: 'No direct path data available to cache.' })
    }

    // Generate Redis key for storing direct path data
    const redisKey = createRedisKey(config.DOMAIN_TEST, config.DIRECT_PATH, res.locals.itemId, config.INFO)

    // Store the direct path data in Redis as JSON
    await storeDataInCache({
      key: redisKey,
      data: res.locals.directPath,
      dataType: config.JSON,
    })

    logger.info('Direct path data successfully cached.')

    res.locals.data = res.locals.directPath
    next()
  } catch (error) {
    // Log the error and send a 500 response if an exception occurs
    logger.error('Error faced in cache middleware, unable to store data in Redis', error.message)
    return res.status(500).json({
      message: 'Error faced in cache middleware, unable to store data in Redis',
      error: error.message,
    })
  }
}

/**
 * Middleware to fetch Google Drive data and filters from Redis cache.
 *
 * This function retrieves cached data for Google Drive files from Redis. If query
 * filters are provided, it fetches filtered data based on the criteria and updates
 * the response object (`res.locals.data`). Proceeds to the next middleware on success
 * or handles errors if any.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express middleware function to proceed to the next step.
 */
const fetchDriveDataFromCache = async (req, res, next) => {
  try {
    // TODO(a.mason): Replace hardcoded admin email with dynamic retrieval from session or JWT
    res.locals.adminEmail = 'testadmin@pvp-test-domain2.com'

    const filters = req.query // Extract filters from response locals

    // Fetch cached drive data from Redis as JSON
    const cachedData = await fetchDataFromCache(createRedisKey(config.DOMAIN_TEST, config.ALL_DRIVES_DATA), config.JSON)

    // If cached data exists
    if (cachedData) {
      if (Object.keys(filters).length > 0) {
        const fetchedFilteredData = await fetchFiltersFromCache(filters)
        res.locals.filters = filters // Store filters in response locals for later use
        res.locals.data = fetchedFilteredData // Store filtered data
      } else {
        // If no filters are provided, store the full cached data
        res.locals.data = cachedData
      }
    } else {
      // If no cached data exists but filters are provided, store filters in response locals
      if (filters) {
        res.locals.filters = filters
      }
    }

    // Proceed to the next middleware
    next()
  } catch (error) {
    // Log the error and send a 500 response if an exception occurs
    logger.error('Error fetching data or filters from Redis:', error.message)
    return res.status(500).json({
      message: 'Error fetching data or filters from Redis',
      error: error.message,
    })
  }
}

/**
 * Middleware to fetch the entire drive structure from Redis cache.
 * If the cached data exists, it is stored in `res.locals.data`. Otherwise, the request continues.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} - Calls `next()` on success or sends a 400/500 response on validation or failure
 */
const fetchEntireDriveStructureFromCache = async (req, res, next) => {
  try {
    const { id, driveName } = req.query // Extract filters from query parameters

    // Input validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "The 'id' parameter is required.",
      })
    }

    // Check if 'id' is provided multiple times
    if (Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: 'Multiple "id" query parameters are not allowed. Please provide only one.',
      })
    }

    // Determine if 'id' is an email address (contains '@'), indicating a personal drive
    const personalDrive = id.includes('@')

    // If it's a shared drive, ensure 'driveName' is present
    if (!personalDrive && !driveName) {
      return res.status(400).json({
        success: false,
        message: "Name of the drive is required for shared drives. Please provide 'driveName' parameter.",
      })
    }

    // Generate the Redis key for fetching the cached drive structure
    const redisKey = personalDrive
      ? createRedisKey(config.DOMAIN_TEST, config.DRIVE_STRUCTURE, config.PERSONAL_DRIVE, id, config.INFO)
      : createRedisKey(config.DOMAIN_TEST, config.DRIVE_STRUCTURE, config.SHARED_DRIVE, id, config.INFO)

    // Fetch cached drive data from Redis as JSON
    const cachedData = await fetchDataFromCache(redisKey, config.JSON)

    // If cached data exists, store it in response locals
    if (cachedData) {
      res.locals.data = cachedData
    }

    // TODO: Replace hardcoded admin email with dynamic retrieval from session or JWT
    res.locals.adminEmail = 'testadmin@pvp-test-domain2.com'
    res.locals.personalDrive = personalDrive
    res.locals.driveName = driveName
    res.locals.id = id

    // Proceed to the next middleware
    next()
  } catch (error) {
    // Log the error and send a 500 response if an exception occurs
    logger.error('Error fetching data or filters from Redis:', error.message)
    return res.status(500).json({
      message: 'Error fetching data or filters from Redis',
      error: error.message,
    })
  }
}

/**
 * Middleware to fetch the direct path from an item to the root folder from Redis cache.
 * If the cached data exists, it is stored in `res.locals.data`. Otherwise, the request continues.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} - Calls `next()` on success or sends a 400/500 response on validation or failure
 */
const fetchDirectPathToRootFolderFromCache = async (req, res, next) => {
  try {
    const { itemId } = req.query // Extract filters from query parameters

    // Input validation: Ensure 'itemId' is provided
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "itemId" is required.',
      })
    }

    // Check if 'itemId' is provided multiple times
    if (Array.isArray(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Multiple "itemId" query parameters are not allowed. Please provide only one.',
      })
    }

    // Validate 'itemId' length (Google Drive file IDs range between 19 and 44 characters)
    if (itemId.length < 19 || itemId.length > 44) {
      return res.status(400).json({
        success: false,
        message: 'The "itemId" provided is incorrect. It must be between 19 and 44 characters long.',
      })
    }

    // Generate Redis key for fetching cached direct path data
    const redisKey = createRedisKey(config.DOMAIN_TEST, 'direct-path', itemId, config.INFO)

    // Fetch cached direct path data from Redis as JSON
    const cachedData = await fetchDataFromCache(redisKey, config.JSON)

    // If cached data exists, store it in response locals
    if (cachedData) {
      res.locals.data = cachedData
    }

    // TODO(a.mason): Replace hardcoded admin email with dynamic retrieval from session or JWT
    res.locals.adminEmail = 'testadmin@pvp-test-domain2.com'
    res.locals.itemId = itemId

    // Proceed to the next middleware
    next()
  } catch (error) {
    // Log the error and send a 500 response if an exception occurs
    logger.error('Error fetching data from Redis:', error.message)
    return res.status(500).json({
      message: 'Error fetching data from Redis',
      error: error.message,
    })
  }
}

// ---------------------------- Helper Functions ----------------------------

/**
 * Fetches items from the cache based on provided filter criteria.
 *
 * This function takes a set of filters, generates corresponding Redis keys,
 * determines the intersection of cached sets associated with those keys,
 * and fetches detailed information for the resulting items.
 *
 * @param {Object} filters - An object containing key-value pairs representing filter criteria.
 * @returns {Promise<Array<Object>>} - A list of detailed information objects for the items matching the filters.
 *                                      Returns an empty array if no keys match.
 * @throws {Error} - If any step in the process fails (handled in called functions).
 */
const fetchFiltersFromCache = async (filters) => {
  let commonItems = []

  // Generate Redis keys for each filter using the filter criteria
  const listOfKeys = await createRedisKeysFromProvidedFilters(filters)

  // If no Redis keys are generated, log the result and exit early
  if (listOfKeys.length === 0) {
    logger.debug('Keys do not exist for the provided filters')
    return []
  }

  // If single filter is selected fetch data directly from cache
  else if (listOfKeys.length === 1) {
    commonItems = await fetchDataFromCache(listOfKeys[0], config.SETS)
  }
  // If multiple filters are selected fetch only the common items from cache
  else {
    commonItems = await fetchCommonItemsAcrossSets(listOfKeys)
  }

  // Fetch detailed information for the intersected items using their IDs
  const listOfItems = await fetchItemsInformationViaID(commonItems)

  // Return the list of fetched items
  return listOfItems
}

/**
 * Fetches all items from the cache based on a specific pattern.
 *
 * @param {string} cursor - Redis scan cursor (default: '0' for starting point).
 * @param {number} count - The pagination limit for fetching keys.
 * @param {string} dataType - The type of data to fetch (e.g., 'hash').
 * @returns {Promise<*>} List of fetched hashes from the cache.
 */
async function fetchAllItemsFromCache(count, cursor = '0') {
  try {
    let allItemsData = []
    const pattern = 'pvp-test-domain2.com:item:*:info' // Define your key pattern
    const { fetchedKeys, nextCursor } = await fetchMultipleKeysFromCache(pattern, count, cursor)

    // Fetch data for each key based on dataType
    for (const key of fetchedKeys) {
      const hashData = await fetchDataFromCache(key, config.HASH)
      allItemsData.push(hashData.name) // Store each hash's data
    }

    console.log(' fetched items:', allItemsData)

    return { allItemsData, nextCursor } // Return fetched items and nextCursor for further pagination
  } catch (error) {
    console.error(`Error fetching items from cache: ${error.message}`)
    throw error
  }
}

/**
 * Generates Redis keys based on provided filter criteria.
 *
 * For each key-value pair in the filters object, a Redis key is constructed
 * using the configured domain and filter prefixes. These keys can be used
 * to query Redis for the associated sets of items.
 *
 * @param {Object} filters - An object containing key-value pairs representing filter criteria.
 * @returns {Promise<Array<string>>} - A list of Redis keys constructed from the filters.
 */
const createRedisKeysFromProvidedFilters = async (filters) => {
  let keysList = [] // Initialize an empty list to hold the Redis keys

  // Loop through each filter criterion
  for (const [key, value] of Object.entries(filters)) {
    // Generate a Redis key for the current filter and add it to the list
    keysList.push(createRedisKey(config.DOMAIN_TEST, config.FILTERS, key, value))
  }

  // Return the list of constructed Redis keys
  return keysList
}

/**
 * Fetches detailed item information from the cache using their IDs.
 *
 * This function retrieves data for each item based on its unique Redis key.
 * If an item's information is found in the cache, it is added to the result list.
 *
 * @param {Set<string>} ids - A set of unique item IDs to fetch from Redis.
 * @returns {Promise<Array<Object>>} - A list of JSON objects representing item details.
 * @throws {Error} - If fetching data from Redis fails.
 */
const fetchItemsInformationViaID = async (ids) => {
  try {
    // Convert the set of IDs into an array for iteration
    const idArray = Array.from(ids)

    // Initialize an empty list to store item information
    const fileInformationList = []

    // Iterate through each item ID
    for (const id of idArray) {
      // Construct the Redis key for the current item
      const redisKey = createRedisKey(config.DOMAIN_TEST, config.ITEM, id, config.INFO)

      // Attempt to fetch the item's information from the cache
      const fileInfo = await fetchDataFromCache(redisKey, config.HASH)

      // If the item's information is found, add it to the list
      if (fileInfo) {
        fileInformationList.push(fileInfo)
      }
    }

    // Return the list of retrieved item information
    return fileInformationList
  } catch (error) {
    // Log the error message for debugging purposes
    logger.error('Error fetching file information from cache:', error.message)

    // Re-throw the error to propagate it up the call stack
    throw new Error('Failed to fetch file information from cache.')
  }
}

/**
 * Stores drive data in Redis for caching purposes.
 *
 * This function takes a list of drive files and stores their hierarchical data
 * and metadata in Redis using a Redis transaction for batching operations.
 *
 * @param {Array} drivesList - The list of drive files to store.
 * @param {boolean} isSharedDrive - Whether the data pertains to shared drives.
 * @returns {Promise<void>}
 */
const storeDriveHierarchyAndFiltersInCache = async (drivesList, isSharedDrive) => {
  try {
    const driveType = isSharedDrive ? config.SHARED_DRIVE : config.PERSONAL_DRIVE
    const driveKeyType = isSharedDrive ? 'driveId' : 'driveName'
    const listKey = isSharedDrive ? config.SHARED_DRIVE : config.PERSONAL_DRIVE

    // Initialize a Redis transaction to batch all commands together
    const redisTransaction = generateTransaction()

    // Store the list of drive IDs or names
    const listOfDrives = drivesList.map((drive) => drive[driveKeyType])
    await storeDataInCache({
      key: createRedisKey(config.DOMAIN_TEST, listKey, config.LIST),
      data: listOfDrives,
      dataType: config.SETS,
      redisTransaction: redisTransaction,
    })

    // Store individual drive data with their hierarchical structures
    for (const drive of drivesList) {
      const driveKey = drive[driveKeyType]
      await storeDataInCache({
        key: createRedisKey(config.DOMAIN_TEST, driveType, driveKey, config.INFO),
        data: drive,
        dataType: config.JSON,
        redisTransaction: redisTransaction,
      })

      // Recursively store file metadata
      if (drive.children) {
        for (const child of drive.children) {
          await storeItemInfo(child, redisTransaction) // Pass the transaction for batching
        }
      }
    }

    // Execute all batched commands in the Redis transaction
    await executeTransaction(redisTransaction)
  } catch (error) {
    logger.error('Error storing drive data in Redis:', error.message)
  }
}

/**
 * Recursively stores file metadata in Redis.
 *
 * This function traverses the hierarchical structure of files and stores each item's
 * metadata and associated filters in Redis.
 *
 * @param {Object} item - The file or folder to store.
 * @param {Object} redisTransaction - The Redis transaction for batching operations.
 * @returns {Promise<void>}
 */
const storeItemInfo = async (item, redisTransaction) => {
  try {
    const populatedData = populateDataModel(item)

    // Store item metadata in Redis
    await storeDataInCache({
      key: createRedisKey(config.DOMAIN_TEST, config.ITEM, item.id, config.INFO),
      data: populatedData,
      dataType: config.HASH,
      redisTransaction: redisTransaction,
    })

    // Update filters for the file
    await createOrUpdateFiltersForFile(populatedData, redisTransaction)

    // Recursively store child items
    if (item.children) {
      for (const child of item.children) {
        await storeItemInfo(child, redisTransaction)
      }
    }
  } catch (error) {
    logger.error(`Error storing item info for ${item.id}:`, error.message)
  }
}

module.exports = {
  // fetch from cache
  fetchDriveDataFromCache,
  fetchEntireDriveStructureFromCache,
  fetchDirectPathToRootFolderFromCache,

  // store in cache
  storeDriveDataInCache,
  storeEntireDriveStructureInCache,
  storeDirectPathToRootFolderInCache,
}
