/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

// routes/projectRoutes.js
const express = require('express')
const router = express.Router()
const projectController = require('../controllers/projectController')
const authController = require('../controllers/authController')

router.get('/test-project', (req, res) => {
  res.send('Test Success')
})

// router.get('/initiate-project', authController.oauth2callback, projectController.createProject);
router.get('/projects', projectController.getAllProjects)
router.post('/get-project-data', projectController.getProjectData)

router.post('/get-project-id', projectController.getProjectIdByEmail)

module.exports = router
