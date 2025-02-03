const config = require('../config/config.js')
const redisClient = require('../config/redis.js')
const logger = require('../logger/logger.js')(__filename, 'Redis Cache Service')

// Optimize round-trip times by combining Redis commands
// Function to create a Redis Transaction - Ordered way
// this guarantees atomicity
// It's important to note that even when a command fails, all the other commands in the queue are processed
// Redis will not stop the processing of commands.
const generateTransaction = () => {
  return redisClient.multi() // Creates and returns a new transaction
}

// Runs the transaction contaning a list of commands
const executeTransaction = (redisTransaction) => {
  return redisTransaction.exec()
}

const getClient = (redisTransaction) => (redisTransaction ? redisTransaction : redisClient)

// // Function to scan all keys in Redis
// const scanKeys = async (redisTransaction = null, matchPattern = '*', count = 100) => {
//   try {
//     const client = getClient(redisTransaction)

//     let cursor = '0'
//     let keys = []

//     do {
//       // Perform SCAN operation
//       const result = await client.scan(cursor, { MATCH: matchPattern, COUNT: count })
//       cursor = result[0]
//       keys = keys.concat(result[1])
//     } while (cursor !== '0') // Continue until the cursor is 0

//     if (keys.length === 0) {
//       // console.log(`No keys match the pattern: ${matchPattern}`)
//       return []
//     }

//     // console.log(`Fetched ${keys.length} keys matching the pattern: ${matchPattern}`)
//     return keys
//   } catch (error) {
//     logger.error('Failed to complete the SCAN operation:', error)
//     throw error
//   }
// }

// Function to scan all keys with enhanced error handling
const scanKeys = async (redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    // Perform SCAN operation
    const result = await client.scan('0', { COUNT: 100 })

    if (result.keys.length == 0) {
      logger.debug('no key')
      return
    }
    logger.debug('result.keys.length = ', result.keys.length)
    return result.keys
  } catch (error) {
    logger.error('Failed to complete the scan operation:', error)
  }
}

// Function to scan specific keys
const scanSpecificKeys = async (pattern, count = 1000, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    // Perform SCAN operation
    const result = await client.scan('0', { MATCH: pattern, COUNT: count })

    if (result.keys.length == 0) {
      // console.log(`No key exists`)
      return
    }
    console.log('result.keys:', result.keys)
    return result.keys
  } catch (error) {
    logger.error('Failed to complete the scan operation:', error)
  }
}

// Generic function to delete a key-value pair from Redis
const deleteKeyInRedis = async (key, redisTransaction = null) => {
  try {
    if (!key) {
      throw new Error('Key is required to delete data.')
    }
    const client = getClient(redisTransaction)

    const result = await client.del(key)
    if (result === 1) {
      // console.log(`Key "${key}" successfully deleted from Redis.`)
    } else {
      // console.log(`Key "${key}" not found in Redis.`)
    }

    return result
  } catch (err) {
    logger.error(`Error deleting key "${key}" from Redis:`, err)
    throw err
  }
}

// String

// Generic function to set a value in Redis with optional TTL
const setStringInRedis = async (key, value, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !value) {
      throw new Error('Invalid parameters: Key and value are required.')
    }

    if (ttl) {
      // remove the set ex and try using the following
      await client.setEx(key, config.TTL, value)
    } else {
      await client.set(key, value)
    }
    // console.log(`Value set in Redis for key: "${key}"${ttl ? ` with TTL: ${config.TTL} seconds` : ''}`)
  } catch (err) {
    logger.error(`Error setting value in Redis for key "${key}":`, err)
    throw err
  }
}

// Function to get a value from Redis
const getStringFromRedis = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!key) {
      // console.log('Key is required to fetch data.')
      return null
    } // Fetch data from Redis

    const fetchedString = await client.get(key)
    if (!fetchedString) {
      // console.log(`No data found in Redis for key: "${key}".`)
      return null
    } // Attempt to parse JSON, or return raw string

    // console.log(fetchedString)
    return fetchedString
  } catch (err) {
    logger.error(`Error fetching data from Redis for key "${key}":`, err)
    return null
  }
}

// JSON

// Function to set a JSON object in Redis
const setJsonInRedis = async (key, jsonObject, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !jsonObject) {
      throw new Error('Invalid parameters: Key and JSON object are required.')
    } // Store the JSON object using RedisJSON's JSON.SET

    await client.json.set(key, '$', jsonObject) // Optionally set TTL for the key

    if (ttl) {
      await client.expire(key, config.TTL)
    } // console.log(`JSON object set in Redis for key: "${key}"${ttl ? ` with TTL: ${config.TTL} seconds` : ''}`)
  } catch (err) {
    logger.error(`Error setting JSON in Redis for key "${key}":`, err)
    throw err
  }
}

// Function to get a JSON object from Redis
const getJsonFromRedis = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const jsonObject = await client.json.get(key, '$') // Retrieve entire JSON object

    if (!jsonObject) {
      // console.log(`No JSON object found in Redis for key: "${key}".`)
      return null
    }

    return jsonObject
  } catch (err) {
    logger.error(`Error retrieving JSON object from Redis for key "${key}":`, err)
    throw err
  }
}

// Function to retrieve a specific field from a JSON object
const getJsonFieldFromRedis = async (key, path, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const value = await client.json.get(key, path) // Retrieve value at a specific path
    if (value === null) {
      // console.log(`No data found at path "${path}" for key "${key}".`)
      return null
    } // console.log(`Retrieved value from JSON object for key "${key}" at path "${path}":`, value)

    return value
  } catch (err) {
    logger.error(`Error retrieving JSON field for key "${key}" at path "${path}":`, err)
    throw err
  }
}

// Function to update a specific field in a JSON object
const updateJsonFieldInRedis = async (key, path, value, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !path) {
      throw new Error('Invalid parameters: Key and JSON path are required.')
    } // Use JSON.SET with a path to update a specific field

    await client.json.set(key, path, value)
    // console.log(`Updated field "${path}" in JSON object for key "${key}" with value:`, value)
  } catch (err) {
    logger.error(`Error updating JSON field for key "${key}" at path "${path}":`, err)
    throw err
  }
}

// Function to delete a JSON object from Redis
const deleteJsonFromRedis = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const result = await client.json.del(key) // Delete the JSON object
    if (result === 1) {
      // console.log(`JSON object for key "${key}" successfully deleted.`)
    } else {
      // console.log(`JSON object for key "${key}" not found.`)
    }
    return result
  } catch (err) {
    logger.error(`Error deleting JSON object for key "${key}":`, err)
    throw err
  }
}

// HASHES

/**
 * Function to set a hash in Redis using the object syntax.
 *
 * @param {string} key - The Redis key for the hash.
 * @param {Object} hashObject - An object containing the fields and values to set in the hash.
 * @returns {Promise<void>}
 */
const setHashInRedis = async (key, hashObject, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    if (!key || !hashObject || typeof hashObject !== 'object') {
      throw new Error('Invalid parameters: Key and hash object are required.')
    } // Handle potential invalid values

    const sanitizedObject = Object.fromEntries(
      Object.entries(hashObject).map(([field, value]) => [
        field,
        value === undefined || value === null
          ? '' // Replace undefined or null with an empty string
          : Array.isArray(value)
          ? JSON.stringify(value) // Convert arrays to JSON strings
          : value, // Use the value as is for other types
      ])
    )

    await client.hSet(key, sanitizedObject)
    // console.log(`Hash set in Redis for key "${key}" with fields:`, sanitizedObject)
  } catch (err) {
    logger.error(`Error setting hash in Redis for key "${key}":`, err)
    throw err
  }
}

// Function to get an entire hash from Redis
const getHashFromRedis = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const hash = await client.hGetAll(key) // Retrieve all fields in the hash
    if (Object.keys(hash).length === 0) {
      // console.log(`No hash found in Redis for key "${key}".`)
      return null
    }

    //console.log(`Retrieved hash for key "${key}" -> `, hash)
    return hash
  } catch (err) {
    logger.error(`Error retrieving hash from Redis for key "${key}":`, err)
    throw err
  }
}

// Function to get a specific field from a hash
const getHashFieldFromRedis = async (key, field, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const value = await client.hGet(key, field) // Retrieve a specific field
    if (value === null) {
      // console.log(`Field "${field}" not found in hash for key "${key}".`)
      return null
    }

    // console.log(`Retrieved value for field "${field}" in hash for key "${key}":`, value)
    return value
  } catch (err) {
    logger.error(`Error retrieving field "${field}" from hash for key "${key}":`, err)
    throw err
  }
}

// Function to check if a field exists in a hash
const hashFieldExists = async (key, field, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const exists = await client.hExists(key, field) // Check if a field exists
    // console.log(`Field "${field}" ${exists ? 'exists' : 'does not exist'} in hash for key "${key}".`)
    return exists
  } catch (err) {
    logger.error(`Error checking existence of field "${field}" in hash for key "${key}":`, err)
    throw err
  }
}

// Function to delete fields from a hash
const deleteHashFieldsFromRedis = async (key, fields, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('Fields must be an array with at least one element.')
    } // Use HDEL to delete specified fields

    const deletedCount = await client.hDel(key, fields)

    // console.log(`Deleted ${deletedCount} field(s) from hash for key "${key}". Fields: ${fields}`)
    return deletedCount
  } catch (err) {
    logger.error(`Error deleting fields from hash for key "${key}":`, err)
    throw err
  }
}

// SETS

// Function to add members to a Redis set
const addToSetInRedis = async (key, member, redisTransaction = null, ttl) => {
  try {
    const client = getClient(redisTransaction)

    const addedCount = await client.sAdd(key, member)
    // console.log(`Added ${addedCount} member(s) to set "${key}":`, members)
    return addedCount
  } catch (err) {
    logger.error(`Error adding members to set "${key}":`, err)
    throw err
  }
}

// Function to retrieve all members of a Redis set
const getSetMembers = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const members = await client.sMembers(key) // Retrieve all members of the set
    if (members.length === 0) {
      // console.log(`No members found in set "${key}".`)
      return []
    }

    return members
  } catch (err) {
    logger.error(`Error retrieving members of set "${key}":`, err)
    throw err
  }
}

// Function to check if a value is a member of a Redis set
const isMemberOfSet = async (key, member, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const isMember = await client.sIsMember(key, member) // Check if the value is a member
    return isMember
  } catch (err) {
    logger.error(`Error checking membership of value "${member}" in set "${key}":`, err)
    throw err
  }
}

// Function to remove members from a Redis set
const removeFromSet = async (key, members, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(members) || members.length === 0) {
      throw new Error('Members must be an array with at least one element.')
    } // Use SREM to remove members from the set

    const removedCount = await client.sRem(key, members)
    // console.log(`Removed ${removedCount} member(s) from set "${key}":`, members)
    return removedCount
  } catch (err) {
    logger.error(`Error removing members from set "${key}":`, err)
    throw err
  }
}

// Function to get the union of multiple sets
const unionOfSets = async (keys, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(keys) || keys.length < 2) {
      throw new Error('At least two set keys are required for union operation.')
    }

    const union = await client.sUnion(keys)
    // console.log(`Union of sets ${keys}:`, union)
    return union
  } catch (err) {
    logger.error(`Error performing union operation on sets ${keys}:`, err)
    throw err
  }
}

// Function to get the intersection of multiple sets
const intersectionOfSets = async (keys, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    if (!Array.isArray(keys) || keys.length < 2) {
      throw new Error('At least two set keys are required for intersection operation.')
    }

    const intersection = await client.sInter(keys)
    // // console.log(`Intersection of sets ${keys}:`, intersection)
    return intersection
  } catch (err) {
    logger.error(`Error performing intersection operation on sets ${keys}:`, err)
    throw err
  }
}

// Function to get the cardinality (size) of a Redis set
const getSetSize = async (key, redisTransaction = null) => {
  try {
    const client = getClient(redisTransaction)

    const size = await client.sCard(key) // Get the number of members in the set
    // console.log(`Set "${key}" contains ${size} member(s).`)
    return size
  } catch (err) {
    logger.error(`Error getting size of set "${key}":`, err)
    throw err
  }
}

//---------------------------------------------------------------------------------------------------------------

module.exports = {
  scanKeys,
  scanSpecificKeys,
  deleteKeyInRedis,
  generateTransaction,
  executeTransaction,

  //String
  getStringFromRedis,
  setStringInRedis,

  //JSON
  setJsonInRedis,
  getJsonFromRedis,
  getJsonFieldFromRedis,
  updateJsonFieldInRedis,
  deleteJsonFromRedis,

  //Hashes
  setHashInRedis,
  getHashFromRedis,
  getHashFieldFromRedis,
  hashFieldExists,
  deleteHashFieldsFromRedis,

  //Set
  addToSetInRedis,
  getSetMembers,
  isMemberOfSet,
  removeFromSet,
  unionOfSets,
  intersectionOfSets,
  getSetSize,
}
