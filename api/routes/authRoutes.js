const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register route
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  authController.register
);

// Login route
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// Get user profile
router.get('/profile', authenticateToken, authController.getProfile);

// Update push token
router.post('/push-token', authenticateToken, authController.updatePushToken);

// Logout user and clear push token
router.post('/logout', authenticateToken, authController.logout);

module.exports = router; 