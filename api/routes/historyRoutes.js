const express = require('express');
const historyController = require('../controllers/historyController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener todo el historial del usuario
router.get('/', authenticateToken, historyController.getHistory);

// Añadir una nueva entrada al historial
router.post('/', authenticateToken, historyController.addHistoryEntry);

// Actualizar el nombre de una entrada del historial
router.put('/:id', authenticateToken, historyController.updateHistoryEntryName);

// Eliminar una entrada específica del historial
router.delete('/:id', authenticateToken, historyController.deleteHistoryEntry);

// Marcar/desmarcar como favorito
router.patch('/:id/favorite', authenticateToken, historyController.toggleFavoriteStatus);

module.exports = router; 