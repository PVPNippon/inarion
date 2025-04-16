/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const config = require('../config/config')
const {
  checkIfKeyExistsInCache,
  fetchSetOfFilesFromCache,
  fetchDataFromCache,
  storeDataInCache,
  fetchCommonItemsAcrossSets,
  fetchMultipleKeysFromCache,
  clearKeyInCache,
} = require('../controllers/cacheController')
const { createOrUpdateFiltersForFile } = require('../helper/redis/redisFiltersHelper')
const populateDataModel = require('../models/redisDriveItem')
const { generateTransaction, executeTransaction } = require('../services/redisCacheService')
const { createRedisKey } = require('../utility/utilityFunctions')
const logger = require('../logger/logger')(__filename, 'Cache Middleware')

// ---------------------------- Store ----------------------------

/**
 * Middleware to store the list of shared drives in Redis cache.
 *
 * This middleware first checks if the response already contains cached data to avoid redundant storage.
 * If not, it retrieves the shared drives from res.locals, stores them in Redis as a sorted set,
 * and then sets the cached data in res.locals for downstream processing.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object containing shared drives in res.locals.sharedDrives.
 * @param {Function} next - Callback to the next middleware.
 * @returns {Promise<void>} Proceeds to the next middleware after caching the shared drives.
 */
const storeSharedDrivesInCache = async (req, res, next) => {
  try {
    // Skip caching if data is already present in res.locals.
    if (res.locals.data) {
      return next()
    }

    const { sharedDrives } = res.locals

    // Store the shared drives in Redis as a sorted set for efficient range queries.
    await storeDataInCache({
      key: createRedisKey(config.DOMAIN_TEST, config.SHARED_DRIVES),
      data: sharedDrives,
      dataType: config.SORTED_SETS,
    })

    // Set the cached shared drives data in res.locals for further middleware consumption.
    res.locals.data = sharedDrives

    // Proceed to the next middleware.
    next()
  } catch (error) {
    // Log error details and return a 500 response if caching fails.
    logger.error('Error faced in cache middleware, unable to store data in Redis', error.message)
    return res.status(500).json({
      message: 'Error faced in cache middleware, unable to store data in Redis',
      error: error.message,
    })
  }
}

/**
 * Middleware to store the list of users in Redis cache.
 *
 * This middleware checks if user data is already cached in res.locals. If not, it retrieves the user list,
 * stores it in Redis as a sorted set, and then makes the cached data available in res.locals for subsequent middleware.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object containing users in res.locals.users.
 * @param {Function} next - Callback to the next middleware.
 * @returns {Promise<void>} Proceeds to the next middleware after caching the user data.
 */
const storeUsersInCache = async (req, res, next) => {
  try {
    // Avoid duplicate caching if the data already exists.
    if (res.locals.data) {
      return next()
    }

    const { users } = res.locals

    // Store the user list in Redis as a sorted set.
    await storeDataInCache({
      key: createRedisKey(config.DOMAIN_TEST, config.USERS),
      data: users,
      dataType: config.SORTED_SETS,
    })

    // Make the cached users data available for downstream processes.
    res.locals.data = users

    // Proceed to the next middleware.
    next()
  } catch (error) {
    // Log error details and return a 500 response if data storage fails.
    logger.error('Error faced in cache middleware, unable to store data in Redis', error.message)
    return res.status(500).json({
      message: 'Error faced in cache middleware, unable to store data in Redis',
      error: error.message,
    })
  }
}

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
 * Middleware to store filtered files from cache.
 *
 * This middleware checks if response locals already contain cached data. If not, it retrieves
 * necessary information from res.locals and stores the filtered file data in Redis. Depending on
 * whether only shared drives are being listed or not, it constructs the appropriate Redis keys
 * and delegates storage to storeDataInCache. This design centralizes caching logic, ensuring consistency
 * and maintainability across the application.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object containing local data.
 * @param {Function} next - Express middleware next function.
 * @returns {Promise<void>} Proceeds to the next middleware if caching is successful.
 * @throws {Error} Returns a 500 HTTP response with an error message if an error occurs.
 */
const storeFilteredFilesFromCache = async (req, res, next) => {
  try {
    // If cached data is already available in res.locals, skip caching to avoid redundant operations.
    if (res.locals.data) {
      return next()
    }

    // Destructure necessary variables from res.locals for further processing.
    const { allFiles, remainingDrives, nextPageToken, filtersKey, ownerType, driveType, onlyListSharedDrives } =
      res.locals

    let filesSet = new Set()
    if (onlyListSharedDrives) {
      // For shared drives-only: store the list of drive IDs and nextPageToken.

      // Create a Redis key for storing files related to shared drives.
      const drivesKey = createRedisKey(config.DOMAIN_TEST, config.FILTERS, driveType, ownerType, filtersKey, 'files')
      await storeDataInCache({
        key: drivesKey,
        data: allFiles,
        dataType: config.SORTED_SETS,
      })

      // If a nextPageToken is present, store it using an appropriate Redis key.
      if (nextPageToken) {
        const nextPageTokenKey = createRedisKey(
          config.DOMAIN_TEST,
          config.FILTERS,
          driveType,
          ownerType,
          filtersKey,
          'next-page-token'
        )
        await storeDataInCache({
          key: nextPageTokenKey,
          data: nextPageToken,
          dataType: config.STRING,
        })
      }
    } else {
      // For files: store the list of file IDs, along with remaining drives and nextPageToken if applicable.

      // Extract file IDs from allFiles and create a set to eliminate duplicates.
      filesSet = allFiles.map((file) => file.id)

      const filesKey = createRedisKey(config.DOMAIN_TEST, config.FILTERS, driveType, ownerType, filtersKey, 'files')
      await storeDataInCache({
        key: filesKey,
        data: filesSet,
        dataType: config.SORTED_SETS,
      })

      // Generate Redis keys for remaining drives and nextPageToken.
      const remainingDrivesKey = createRedisKey(
        config.DOMAIN_TEST,
        config.FILTERS,
        driveType,
        ownerType,
        filtersKey,
        'remaining-drives-list'
      )
      const nextPageTokenKey = createRedisKey(
        config.DOMAIN_TEST,
        config.FILTERS,
        driveType,
        ownerType,
        filtersKey,
        'next-page-token'
      )

      // If there are no remaining drives and no nextPageToken, clear the keys to prevent stale data.
      if ((!remainingDrives || remainingDrives.length === 0) && !nextPageToken) {
        await clearKeyInCache([remainingDrivesKey, nextPageTokenKey])
      } else {
        // If remaining drives exist, store them in cache.
        if (remainingDrives && remainingDrives.length > 0) {
          await storeDataInCache({
            key: remainingDrivesKey,
            data: remainingDrives,
            dataType: config.SETS,
          })
        }
        // Similarly, store the nextPageToken if available.
        if (nextPageToken) {
          await storeDataInCache({
            key: nextPageTokenKey,
            data: nextPageToken,
            dataType: config.STRING,
          })
        }
      }
    }

    // Set res.locals.data to the cached drive or file identifiers for downstream middleware consumption.
    res.locals.data = onlyListSharedDrives ? allFiles : filesSet
    next()
  } catch (error) {
    // Log the error details and respond with a 500 status to indicate a caching failure.
    logger.error('Error storing in cache:', error.message)
    return res.status(500).json({ message: 'Failed to store in cache.', error: error.message })
  }
}

// ---------------------------- Fetch --------------------------------

/**
 * Middleware to fetch shared drives from Redis cache.
 *
 * This middleware sets a temporary admin email (to be replaced with dynamic retrieval)
 * and attempts to fetch cached shared drives stored as a sorted set in Redis.
 * If cached data exists, it is attached to res.locals.data for further processing.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Callback to the next middleware.
 * @returns {Promise<void>} Proceeds to the next middleware after fetching cached shared drives.
 */
const fetchSharedDrivesFromCache = async (req, res, next) => {
  try {
    res.locals.adminEmail = config.SUPER_ADMIN_EMAIL

    // Retrieve cached shared drives from Redis, expecting data stored as SORTED SETS.
    const cachedData = await fetchSetOfFilesFromCache(
      createRedisKey(config.DOMAIN_TEST, config.SHARED_DRIVES),
      config.SORTED_SETS
    )

    // If cached data exists, assign it to res.locals.data for downstream middleware.
    if (cachedData.length != 0) {
      res.locals.data = cachedData
    }

    // Proceed to the next middleware.
    next()
  } catch (error) {
    // Log the error and respond with a 500 error if the fetch operation fails.
    logger.error('Error fetching data or filters from Redis:', error.message)
    return res.status(500).json({
      message: 'Error fetching data or filters from Redis',
      error: error.message,
    })
  }
}

/**
 * Middleware to fetch users from Redis cache.
 *
 * This middleware sets a temporary admin email (to be updated later with dynamic values)
 * and attempts to retrieve cached user data stored as a sorted set in Redis.
 * If the cache contains data, it is assigned to res.locals.data for further processing.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Callback to the next middleware.
 * @returns {Promise<void>} Proceeds to the next middleware after fetching cached user data.
 */
const fetchUsersFromCache = async (req, res, next) => {
  try {
    res.locals.adminEmail = config.SUPER_ADMIN_EMAIL

    // Retrieve cached users from Redis, stored as SORTED SETS.
    const cachedData = await fetchSetOfFilesFromCache(
      createRedisKey(config.DOMAIN_TEST, config.USERS),
      config.SORTED_SETS
    )

    // If there is cached data, attach it to res.locals.data.
    if (cachedData.length != 0) {
      res.locals.data = cachedData
    }

    // Proceed to the next middleware.
    next()
  } catch (error) {
    // Log the error and return a 500 error response if the cache fetch fails.
    logger.error('Error fetching data or filters from Redis:', error.message)
    return res.status(500).json({
      message: 'Error fetching data or filters from Redis',
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
    res.locals.adminEmail = config.SUPER_ADMIN_EMAIL

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

    res.locals.adminEmail = config.SUPER_ADMIN_EMAIL
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

    res.locals.adminEmail = config.SUPER_ADMIN_EMAIL
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

/**
 * Middleware to fetch filtered files from cache and validate query parameters.
 *
 * This middleware validates incoming query parameters (e.g., page, owner, sharedDrive) to ensure
 * that they are correctly formatted and logically consistent. It then builds Redis keys using
 * these parameters, calculates the range for pagination, and attempts to retrieve the relevant
 * cached data. The middleware handles partial cache hits by also retrieving nextPageToken and remaining
 * drives when necessary, and passes these values along via res.locals for subsequent processing.
 *
 * @param {Object} req - Express request object containing query parameters.
 * @param {Object} res - Express response object used for returning responses and storing fetched data.
 * @param {Function} next - Express middleware next function.
 * @returns {Promise<void>} Proceeds to the next middleware if cache retrieval and parameter validation succeed.
 * @throws {Error} Returns a 400 or 500 HTTP response with an error message if validation fails or a caching error occurs.
 */
const fetchFilteredFilesFromCache = async (req, res, next) => {
  try {
    // --- Parse and validate query parameters ---
    const { page, onlyListSharedDrives, listFilesInsideSharedDrives, owner, sharedDrive, ...filters } = req.query

    const pageNumber = Number(page)
    const hasMember = Boolean(filters.hasMember)
    const hasManagers = Boolean(filters.hasManagers)
    const countNumber = Number(config.ITEM_LIMIT)

    // Ensure that the page parameter is provided.
    if (page === undefined || page === null || page === '') {
      return res.status(400).json({ message: 'Page parameter not provided' })
    }

    // Validate that the page parameter is a positive integer.
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: 'Invalid page parameter' })
    }

    // Validate mutually exclusive parameters: cannot provide listFilesInsideSharedDrives with owner.
    if (owner && Boolean(listFilesInsideSharedDrives)) {
      return res.status(400).json({
        message:
          "Invalid query parameters: Cannot provide 'listFilesInsideSharedDrives=true' when 'owner' is specified.",
      })
    }

    // Ensure that only one of owner or sharedDrive is specified.
    if (owner && sharedDrive) {
      return res.status(400).json({
        message: "Please select either from a shared drive or from a user's my drive",
      })
    }

    // Validate that hasMembers or hasManagers are only used when onlyListSharedDrives is true.
    if ((filters.hasMembers || filters.hasManagers) && !Boolean(onlyListSharedDrives)) {
      return res.status(400).json({
        message: 'hasMembers or hasManagers can only be selected when onlyListSharedDrives is true',
      })
    }

    // Determine ownerType based on the onlyListSharedDrives flag and provided parameters.
    let ownerType
    if (Boolean(onlyListSharedDrives)) {
      ownerType = 'metadata'
    } else {
      ownerType = owner ? owner : sharedDrive
    }

    // Determine driveType based on provided query flags.
    const driveType =
      Boolean(listFilesInsideSharedDrives) || Boolean(onlyListSharedDrives) ? 'shared-drives' : 'all-drives'

    // --- Build the filter key and corresponding Redis keys ---
    const cacheKey = buildQueryString(filters)
    const filtersKey = cacheKey.length === 0 ? 'no-filters' : cacheKey

    // Create unique Redis keys for files, next page token, and remaining drives.
    const listOfFilesKey = createRedisKey(config.DOMAIN_TEST, config.FILTERS, driveType, ownerType, filtersKey, 'files')
    const nextPageTokenKey = createRedisKey(
      config.DOMAIN_TEST,
      config.FILTERS,
      driveType,
      ownerType,
      filtersKey,
      'next-page-token'
    )
    const remainingDrivesKey = createRedisKey(
      config.DOMAIN_TEST,
      config.FILTERS,
      driveType,
      ownerType,
      filtersKey,
      'remaining-drives-list'
    )

    // --- Calculate the requested range for pagination ---
    const startIndex = (pageNumber - 1) * countNumber + 1
    const endIndex = pageNumber * countNumber

    // Check if the cache contains a sorted set for the list of files.
    const keyExistsInCache = await checkIfKeyExistsInCache(listOfFilesKey, config.SORTED_SETS)
    // console.log('listOfFilesKey =', listOfFilesKey)
    // console.log('nextPageTokenKey =', nextPageTokenKey)
    // console.log('keyExistsInCache =', keyExistsInCache)

    if (keyExistsInCache) {
      // Attempt to fetch a specific page of files from the cached sorted set.
      const cachedPageFiles = await fetchSetOfFilesFromCache(listOfFilesKey, config.SORTED_SETS, startIndex, endIndex)

      if (cachedPageFiles && cachedPageFiles.length > 0) {
        // If the complete page is available, store the data for further processing.
        res.locals.data = cachedPageFiles
      } else {
        // In case of a partial cache hit, attempt to retrieve pagination details.
        const nextPageToken = await fetchDataFromCache(nextPageTokenKey, config.STRING)

        if (nextPageToken) {
          // Pass the nextPageToken and remaining drives data to res.locals for downstream use.
          res.locals.nextPageToken = nextPageToken
          res.locals.remainingDrives = await fetchDataFromCache(remainingDrivesKey, config.SETS)
        } else {
          // If no nextPageToken exists, assume the fetched data represents the final page.
          res.locals.data = cachedPageFiles
        }
      }
    }

    // --- Pass additional validated and computed data to subsequent middleware ---
    res.locals.filters = filters
    res.locals.fileCount = countNumber
    res.locals.filtersKey = filtersKey
    res.locals.ownerType = ownerType
    res.locals.driveType = driveType
    res.locals.hasMember = hasMember
    res.locals.hasManagers = hasManagers

    res.locals.onlyListSharedDrives = Boolean(onlyListSharedDrives)
    res.locals.listFilesInsideSharedDrives = Boolean(listFilesInsideSharedDrives)

    // Propagate owner information if provided.
    if (owner || sharedDrive) {
      res.locals.owner = owner || sharedDrive
    }

    res.locals.adminEmail = config.SUPER_ADMIN_EMAIL

    next()
  } catch (error) {
    // Log the error with context and return a 500 error response for cache fetching failures.
    logger.error('Error fetching from cache:', error.message)
    return res.status(500).json({ message: 'Cache error.', error: error.message })
  }
}

// ---------------------------- Helper Functions ----------------------------

/**
 * Helper function to build a query string from an object of query parameters.
 *
 * This function converts key-value pairs into a query string format, which can be used to
 * generate unique cache keys based on filtering criteria. It is essential for maintaining
 * consistency in cache key generation across different query parameter combinations.
 *
 * @param {Object} queryParams - An object representing query parameters.
 * @returns {string} A string where each key-value pair is joined by '=' and pairs are separated by '&'.
 */
function buildQueryString(queryParams) {
  return Object.entries(queryParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
}

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
    const pattern = `${config.DOMAIN_TEST}:item:*:info` // Define your key pattern
    const { fetchedKeys, nextCursor } = await fetchMultipleKeysFromCache(pattern, count, cursor)

    // Fetch data for each key based on dataType
    for (const key of fetchedKeys) {
      const hashData = await fetchDataFromCache(key, config.HASH)
      allItemsData.push(hashData.name) // Store each hash's data
    }
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
  // store in cache
  storeSharedDrivesInCache,
  storeUsersInCache,
  storeDriveDataInCache,
  storeEntireDriveStructureInCache,
  storeDirectPathToRootFolderInCache,
  storeFilteredFilesFromCache,

  // fetch from cache
  fetchSharedDrivesFromCache,
  fetchUsersFromCache,
  fetchDriveDataFromCache,
  fetchEntireDriveStructureFromCache,
  fetchDirectPathToRootFolderFromCache,
  fetchFilteredFilesFromCache,
}
