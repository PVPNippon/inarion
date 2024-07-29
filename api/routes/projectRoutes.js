// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/test-project', (req, res)=>{
    res.send('Test Success');
});
router.post('/create-project', projectController.createProject);
router.get('/projects', projectController.getAllProjects);
router.get('/get-project-data', projectController.getProjectData);



module.exports = router;
