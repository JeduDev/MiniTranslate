const { client } = require('../config/db');
const crypto = require('crypto');

// Obtener todo el historial de un usuario
const getHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await client.execute({
      sql: 'SELECT id, user_id, name, from_text, to_text, from_lang, to_lang, is_favorite, created_at FROM translation_history WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId],
    });

    // Mapea los resultados para que coincidan con la interfaz del frontend (camelCase)
    const history = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      fromText: row.from_text,
      toText: row.to_text,
      fromLang: row.from_lang,
      toLang: row.to_lang,
      is_favorite: Boolean(row.is_favorite),
      createdAt: row.created_at
    }));

    res.json(history);
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
};

// Añadir una nueva entrada al historial
const addHistoryEntry = async (req, res) => {
  const userId = req.user.id;
  const { name, fromText, toText, fromLang, toLang } = req.body;
  const id = crypto.randomUUID();

  if (!fromText || !toText || !fromLang || !toLang) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await client.execute({
      sql: 'INSERT INTO translation_history (id, user_id, name, from_text, to_text, from_lang, to_lang) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, userId, name || null, fromText, toText, fromLang, toLang],
    });
    // Devuelve la entrada recién creada
    res.status(201).json({ id, userId, name, fromText, toText, fromLang, toLang });
  } catch (error) {
    console.error('Error adding history entry:', error);
    res.status(500).json({ error: 'Failed to add history entry' });
  }
};

// Actualizar el nombre de una entrada del historial
const updateHistoryEntryName = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;
  
    if (name === undefined) {
      return res.status(400).json({ error: 'Name is required' });
    }
  
    try {
      // Verificar que la entrada del historial pertenece al usuario
      const check = await client.execute({
        sql: 'SELECT id FROM translation_history WHERE id = ? AND user_id = ?',
        args: [id, userId],
      });
  
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'History entry not found or not owned by user' });
      }
  
      // Actualizar el nombre
      await client.execute({
        sql: 'UPDATE translation_history SET name = ? WHERE id = ?',
        args: [name, id],
      });
  
      res.status(200).json({ message: 'History entry updated successfully' });
    } catch (error) {
      console.error('Error updating history entry name:', error);
      res.status(500).json({ error: 'Failed to update history entry name' });
    }
};

// Eliminar una entrada del historial
const deleteHistoryEntry = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await client.execute({
      sql: 'DELETE FROM translation_history WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'History entry not found or not owned by user' });
    }

    res.status(200).json({ message: 'History entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
};

// Marcar/desmarcar una entrada como favorita
const toggleFavoriteStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Primero, verifica que la entrada pertenece al usuario y obtén el estado actual
    const current = await client.execute({
      sql: 'SELECT is_favorite FROM translation_history WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'History entry not found or not owned by user' });
    }

    const newFavoriteStatus = !current.rows[0].is_favorite;

    // Actualiza el estado de favorito
    await client.execute({
      sql: 'UPDATE translation_history SET is_favorite = ? WHERE id = ?',
      args: [newFavoriteStatus, id],
    });

    res.status(200).json({ is_favorite: newFavoriteStatus });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
};

module.exports = {
  getHistory,
  addHistoryEntry,
  updateHistoryEntryName,
  deleteHistoryEntry,
  toggleFavoriteStatus,
}; 