// このファイルはテスト目的なのであとで消す
const express = require('express')
const router = express.Router()
const cacheService = require('../services/cacheService.js')

router.get('/:key/ttl', async (req, res) => {
  try {
    const key = req.params.key
    const ttl = await cacheService.getTtl(key)
    res.json({ message: `TTL for ${key} is ${ttl}` })
  } catch (error) {
    console.log('Error getting TTL:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/:key/ttl', async (req, res) => {
  try {
    const key = req.params.key
    const response = await cacheService.setTtl(key, req.body.ttl)
    res.json({ message: `TTL for ${key} is set to ${req.body.ttl}, response: ${response}` })
  } catch (error) {
    console.log('Error setting TTL:', error)
    res.status(500).send({ error: error.message })
  }
})

router.get('/json/:key', async (req, res) => {
  try {
    const key = req.params.key
    const value = await cacheService.getJsons(key)
    res.json(value)
  } catch (error) {
    console.log('Error getting a json', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/json/:key', async (req, res) => {
  try {
    const key = req.params.key
    const response = await cacheService.setJson(key, req.body)
    res.json(response)
  } catch (error) {
    console.log('Error setting a json:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/jsons', async (req, res) => {
  try {
    let keys = req.query.keys
    if (typeof keys === 'string') {
      keys = [keys]
    }
    const value = await cacheService.getJsons(keys)
    res.json(value)
  } catch (error) {
    console.log('Error getting jsons:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/jsons', async (req, res) => {
  try {
    const requestBody = req.body
    const ttl = Number(req.query.ttl)
    const response = await cacheService.setJsons(requestBody, ttl)
    res.json(response)
  } catch (error) {
    console.log('Error setting jsons:', error)
    res.status(500).json({ error: error.message })
  }
})



router.post('/hashes/:key', async (req, res) => {
  try {
    const key = req.params.key
    const hash = req.body
    const response = await cacheService.setHash(key, hash, 60)
    res.json(response)
  } catch (error) {
    console.log('Error setting a hash:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/:key', async (req, res) => {
  try {
    const key = req.params.key
    const response = await cacheService.setJson(key, req.body)
    res.json(response)
  } catch (error) {
    console.log('Error setting value:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router