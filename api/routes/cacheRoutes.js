const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService.js');
const { cache } = require('ejs');

// GET hash associated with `key`
router.get('/hashes/:key', async (req, res) => {
  try {
    let { key } = req.params
    const { field } = req.query
    const { type } = req.query

    if (type === 'undefined') {
      key = undefined
    } else if (type === 'null') {
      key = null
    } else if (type === 'array') {
      key = []
    }
    console.log('key =', key)
    console.log('field =', field)
    const cachedHashValues = await cacheService.getHashValues(key, field)
    console.log('GET hash values:', cachedHashValues)
    res.status(200).json(cachedHashValues)
  } catch (error) {
    console.log('Error fetching a cached hash:', error)

    res.status(500).json({ error: error.message })
  }
})

router.delete('/delete', async (req, res) => {
  try {
    const { key } = req.query

    console.log("key =", key)
    const result = await cacheService.deleteKeys('')
    console.log('DELETE key:', result)
    res.status(200).json({ result })
  } catch (error) {
    console.log('Error deleting key:', error)
    res.status(500).json({ error: error.message })
  }
})

// SET hash values associated with `key`
router.post('/hashes/:key', async (req, res) => {
  try {
    let { key } = req.params
    const ttl = Number(req.query.ttl)
    const fieldsToValuesObj = req.body

    const result = await cacheService.setHash(key, fieldsToValuesObj, ttl)
    
    console.log('SET hash values:', result)
    res.status(200).json({ message: `Data stored in cache with key = ${key}` })
  } catch (error) {
    console.log('Error Storing data in cache:', error)
    console.error(error)

    res.status(500).json({ error: error.message })
  }
})

// GET TTL of `key`
router.get('/hashes/:key/ttl', async (req, res) => {
  try {
    const { key } = req.params
    const { type } = req.query

    let ttlKey = key
    if (type === 'undefined') {
      ttlKey = undefined
    } else if (type === 'null') {
      ttlKey = null
    } else if (type === 'object') {
      ttlKey = {}
    } else if (type === 'array') {
      ttlKey = []
    }
    const ttl = await cacheService.getTTL(key)
    console.log(`GET TTL of key = ${key}:`, ttl)

    res.status(200).json({ message: `TTL of key = ${key}: ${ttl}` })
  } catch (error) {
    console.log('Error fetching TTL:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET TTL of `field` of `key`
router.get('/hashes/:key/fields/:field/ttl', async (req, res) => {
  try {
    const { key, field } = req.params
    const ttls = await cacheService.getHashTTLs(key, field)
    console.log(`GET TTL of key = ${key} and field = ${field}:`, ttls[0])

    res.status(200).json({ message: `TTL of key = ${key} and field = ${field}: ${ttls[0]}` })
  } catch (error) {
    console.log('Error fetching TTL:', error)
    res.status(500).json({ error: error.message })
  }
})

// SET TTL to `key`
router.post('/hashes/:key/ttl', async (req, res) => {
  const { key } = req.params
  const ttl = Number(req.body.ttl)

  if (!Number.isInteger(ttl) || ttl <= 0) {
    return res.status(400).json({ error: 'TTL invalid' })
  }

  try {
    const result = await cacheService.setTTL(key, ttl)
    console.log('SET TTL to key:', result)
    res.status(200).json({ message: `Set TTL = ${ttl} to key = ${key}` })
  } catch (error) {
    console.log(`Error setting TTL = ${ttl} to key = ${key}`, error)
    res.status(500).json({ error: error.message })
  }
})

// SET TTL to `field` of `key` associated with a hash
router.post('/hashes/:key/fields/:field/ttl', async (req, res) => {
  const { key, field } = req.params
  const ttl = Number(req.body.ttl)

  if (!Number.isInteger(ttl) || ttl <= 0) {
    return res.status(400).json({ error: 'TTL invalid' })
  }

  try {
    const result = await cacheService.setHashTTLs(key, field, ttl)
    console.log('SET TTL to fields:', result)
    res.status(200).json({ message: `Set TTL = ${ttl} to key = ${key} and field = ${field}` })
  } catch (error) {
    console.log(`Error setting TTL = ${ttl} to key = ${key} and field = ${field}`, error)
    res.status(500).json({ error: error.message })
  }
})

// router.get('/json', async (req, res) => {
//   const { key } = req.query
//   console.log('GET JSONs keys:', key)

//   try {
//     const cachedData = await cacheService.getJSONs([])
//     console.log('GET JSONs:', cachedData)
//     res.status(200).json(cachedData)
//   } catch (error) {
//     console.log('Error fetching cached JSONs:', error)
//     res.status(500).json({ error: error.message })
//   }
// })

router.get('/json/:key', async (req, res) => {
  const { key } = req.params

  try {
    console.log('GET JSON key=', key)
    const jsonObj = await cacheService.getJSONs(key)
    console.log('GET JSON:', jsonObj)
    res.status(200).json(jsonObj)
  } catch (error) {
    console.log('Error fetching a cached JSON:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/json/:key', async (req, res) => {
  let { key } = req.params
  const { ttl } = req.query

  const { type } = req.query
  if (type === 'undefined') {
    key = undefined
  } else if (type === 'null') {
    key = null
  } else if (type === 'array') {
    key = []
  } else if (type === 'object') {
    key = {}
  }
  console.log('SET JSON CALLED')
  try {
    const jsonObj = req.body
    const result = await cacheService.setJSON(key, jsonObj, Number(ttl))
    console.log('SET JSON:', result)
    res.status(200).json({ message: `SET JSON: ${result}` })
  } catch (error) {
    console.log('Error storing JSON to cache:', error)
    res.status(500).json({ error: error.message })
  }

  console.log('SET JSON DONE')
})

router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const operationResult = await cacheService.deleteKeys(key)
    console.log('Deleted key:', key, ', result:', operationResult)
    res.status(200).json({ message: operationResult })
  } catch (error) {
    console.log('Error deleting key:', error)
    res.status(500).json({ error: error.message })
  }
})


module.exports = router; 