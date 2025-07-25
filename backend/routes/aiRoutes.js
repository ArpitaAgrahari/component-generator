const express = require('express');
const { generateComponent } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/generate', protect, generateComponent);

module.exports = router;