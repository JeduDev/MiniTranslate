const express = require('express');
const { 
  savePushToken, 
  sendTestNotification, 
  getAdminPushTokens,
  notifyAdminsUserLimitReached 
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ruta para guardar el token de notificación push
router.post('/token', authenticateToken, savePushToken);

// Ruta para enviar una notificación de prueba
router.post('/test', authenticateToken, sendTestNotification);

// Ruta para obtener todos los tokens de administradores
router.get('/admin-tokens', authenticateToken, getAdminPushTokens);

// Ruta para notificar a los administradores cuando un usuario alcanza su límite
router.post('/limit-reached', authenticateToken, notifyAdminsUserLimitReached);

module.exports = router; 