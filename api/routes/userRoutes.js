const express = require('express');
const { requestAdminAccess, getUserPushToken } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/request-admin', authenticateToken, requestAdminAccess);
router.get('/:userId/push-token', authenticateToken, getUserPushToken);

module.exports = router; 