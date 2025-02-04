const domainsCacheService = require('../services/domainsCacheService')

/**
 * Middleware to retrieve all domain instances from the cache.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to store the list of domains.
 * @param {Function} next - The next middleware function in the stack.
 *
 * This function attempts to retrieve all domain names from the cache. If no names are found,
 * it passes control to the next middleware. It fetches domain instances corresponding to
 * the names, filters out any null entries, and stores them in `res.locals.data`. If the cache
 * retrieval or processing fails, it logs the error.
 */
async function retrieveAllDomains(req, res, next) {
  try {
    const domainNames = await domainsCacheService.getDomainNames()

    if (domainNames === null) {
      return next()
    }

    const rawDomains = await domainsCacheService.getDomainsByNames(domainNames)
    const domains = rawDomains.filter((domain) => domain !== null)

    if (domains.length === 0) {
      return next()
    }

    res.locals.data = domains
    res.locals.cached = true
  } catch (error) {
    console.log('Error retrieving domain instances from the cache:', error)
  }

  next()
}

/**
 * Middleware to store all domain instances in the cache.
 *
 * If the cache storage fails, it logs the error.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the stack.
 */
async function storeAllDomains(req, res, next) {
  next()

  if (res.locals.cached) {
    return
  }

  if (res.locals.statusCode === 500) {
    return
  }

  try {
    const domains = res.locals.data

    const result = await domainsCacheService.setDomains(domains)
    logger.debug('Stored all domains and instances in the cache:', result)
  } catch (error) {
    console.log('Error storing all domains and instances in the cache:', error)
  }
}

module.exports = {
  retrieveAllDomains,
  storeAllDomains,
}
