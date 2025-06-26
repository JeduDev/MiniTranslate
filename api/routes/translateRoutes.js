const express = require('express');
const translateController = require('../controllers/translateController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Translation route - protected by authentication
router.post('/translate', authenticateToken, translateController.translateText);

// Public translation route (no authentication required)
router.post('/public/translate', translateController.translateText);

module.exports = router; 