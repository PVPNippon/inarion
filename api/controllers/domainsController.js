const domainsService = require('../services/domainsService')
const logger = require('../logger/logger')(__filename, 'Domains Controller')

exports.listAllDomains = async (req, res, next) => {
  if (res.locals.cached) {
    logger.debug('Returning cached list of domains.')
    return next()
  }

  // TODO(m.okamoto): Will it be possible to get the logged-in email address from Redis/session in the future?
  // Retrieve the userEmail from the query parameter
  const { userEmail } = req.query

  try {
    // Get an array with all domains in the organization
    const domains = await domainsService.listDomains({ userEmail })
    logger.debug(`Fetched ${domains.length} domains from the domain. Note this list does not count domain aliases.`)

    // Pass the list of all organization's domains
    res.locals.data = domains
    logger.debug('Returning list of domains.')
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: 'Error fetching domains.' })
  }
  next()
}
