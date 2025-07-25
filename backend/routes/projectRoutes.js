const express = require('express');
const { getProjects, createProject, getProjectById, updateProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware'); // We'll create this next
const router = express.Router();

router.route('/')
    .get(protect, getProjects)
    .post(protect, createProject);

router.route('/:id')
    .get(protect, getProjectById)
    .put(protect, updateProject);

module.exports = router;