const express = require('express');
const { getProjects, createProject, getProjectById, updateProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware'); // We'll create this next
const router = express.Router();
const { downloadComponent } = require('../controllers/downloadController'); // New import

router.route('/')
    .get(protect, getProjects)
    .post(protect, createProject);

router.route('/:id')
    .get(protect, getProjectById)
    .put(protect, updateProject);


router.post('/download', protect, downloadComponent); // New download route

module.exports = router;
