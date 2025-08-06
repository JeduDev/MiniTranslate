const express = require('express');
const {
  getUsersByDate,
  getUsersRoleComparison,
  getAdminRequestsByDate,
  getTranslationHistoryByUser,
  getAllStatistics
} = require('../controllers/statisticsController');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Todas las rutas de estadísticas requieren autenticación de administrador
router.get('/users-by-date', adminAuth, getUsersByDate);
router.get('/users-role-comparison', adminAuth, getUsersRoleComparison);
router.get('/admin-requests-by-date', adminAuth, getAdminRequestsByDate);
router.get('/translations-by-user', adminAuth, getTranslationHistoryByUser);
router.get('/all', adminAuth, getAllStatistics);

module.exports = router;