/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const logger = require('../logger/logger')(__filename, 'Utility Functions')

/**
 * Extracts the primary email addresses from a list of user objects.
 *
 * This function takes an array of user objects (usually fetched from a directory API)
 * and filters out users who don't have a `primaryEmail`. It then returns an array of
 * email addresses from the users that do have a `primaryEmail`.
 *
 * @param {Array} users - An array of user objects, each potentially containing a `primaryEmail` field.
 * @returns {Array<string>} - An array of primary email addresses.
 * @throws {TypeError} - Throws an error if the input is not an array.
 */
const extractEmails = (users = []) => {
  // Validate that the input is an array, otherwise throw a TypeError.
  if (!Array.isArray(users)) {
    throw new TypeError('Expected an array of users')
  }

  // Filter the users to keep only those that have a primaryEmail, then return an array of these emails.
  return users
    .filter((user) => user.primaryEmail) // Retain only users with a valid primaryEmail field.
    .map((user) => user.primaryEmail) // Extract and return the primaryEmail from each valid user.
}

/**
 * Utility to create a Redis key.
 * @param {string} parts - Parts of the Redis key.
 * @returns {string} - The constructed Redis key.
 */
const createRedisKey = (...parts) => parts.filter(Boolean).join(':')

module.exports = {
  extractEmails,
  createRedisKey,
}
