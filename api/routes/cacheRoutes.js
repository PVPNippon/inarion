/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const express = require('express')
const router = express.Router()
const redisCacheService = require('../services/redisCacheService.js')

// // Routes for String data-type
//router.get('/fetch/string/:key', cacheController.getValueFromRedis)
//router.post('/set/string/:key', cacheController.setValueInRedis)

// // Routes for Sets data-type
router.get('/fetch/sets/:key', redisCacheService.getSetMembers)
//router.post('/set/sets/:key', cacheController.setValueInRedis)

// // Routes for Hashes data-type
router.get('/fetch/hashes/:key', redisCacheService.getHashFromRedis)
//router.post('/set/hashes/:key', cacheController.setValueInRedis)

// // Routes for JSON data-type
router.get('/fetch/json/:key', redisCacheService.getJsonFromRedis)
//router.post('/set/json/:key', cacheController.setValueInRedis)

//-----------
router.get('/get/:key', redisCacheService.getStringFromRedis)
//router.get('/get/:key', cacheController.getDataFromRedis)
//router.post('/set/:key', cacheController.setStringInRedis)

router.get('/scan', redisCacheService.scanKeys)
router.get('/delete-cache', redisCacheService.deleteKeyInRedis)

module.exports = router
