const { client } = require('../config/db');

// Obtener usuarios registrados por fecha
const getUsersByDate = async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT 
        DATE(fecha) as date,
        COUNT(*) as count
      FROM users 
      GROUP BY DATE(fecha)
      ORDER BY date DESC
      LIMIT 30
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting users by date:', error);
    res.status(500).json({ error: 'Failed to get users by date' });
  }
};

// Obtener comparación de usuarios admin vs no-admin
const getUsersRoleComparison = async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT 
        CASE 
          WHEN role = 'admin' THEN 'admin'
          ELSE 'user'
        END as role_type,
        COUNT(*) as count
      FROM users 
      GROUP BY role_type
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting users role comparison:', error);
    res.status(500).json({ error: 'Failed to get users role comparison' });
  }
};

// Obtener solicitudes de admin por fecha
const getAdminRequestsByDate = async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT 
        DATE(fecha) as date,
        COUNT(*) as count
      FROM admin_requests 
      GROUP BY DATE(fecha)
      ORDER BY date DESC
      LIMIT 30
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting admin requests by date:', error);
    res.status(500).json({ error: 'Failed to get admin requests by date' });
  }
};

// Obtener historial de traducciones por usuario
const getTranslationHistoryByUser = async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT 
        u.name as user_name,
        u.email as user_email,
        COUNT(th.id) as translation_count
      FROM users u
      LEFT JOIN translation_history th ON u.id = th.user_id
      GROUP BY u.id, u.name, u.email
      ORDER BY translation_count DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting translation history by user:', error);
    res.status(500).json({ error: 'Failed to get translation history by user' });
  }
};

// Obtener todas las estadísticas en una sola llamada
const getAllStatistics = async (req, res) => {
  try {
    // Usuarios por fecha
    const usersByDate = await client.execute(`
      SELECT 
        DATE(fecha) as date,
        COUNT(*) as count
      FROM users 
      GROUP BY DATE(fecha)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Comparación de roles
    const roleComparison = await client.execute(`
      SELECT 
        CASE 
          WHEN role = 'admin' THEN 'admin'
          ELSE 'user'
        END as role_type,
        COUNT(*) as count
      FROM users 
      GROUP BY role_type
    `);

    // Solicitudes de admin por fecha
    const adminRequestsByDate = await client.execute(`
      SELECT 
        DATE(fecha) as date,
        COUNT(*) as count
      FROM admin_requests 
      GROUP BY DATE(fecha)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Historial de traducciones por usuario
    const translationsByUser = await client.execute(`
      SELECT 
        u.name as user_name,
        u.email as user_email,
        COUNT(th.id) as translation_count
      FROM users u
      LEFT JOIN translation_history th ON u.id = th.user_id
      GROUP BY u.id, u.name, u.email
      ORDER BY translation_count DESC
      LIMIT 20
    `);

    res.json({
      usersByDate: usersByDate.rows,
      roleComparison: roleComparison.rows,
      adminRequestsByDate: adminRequestsByDate.rows,
      translationsByUser: translationsByUser.rows
    });
  } catch (error) {
    console.error('Error getting all statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

module.exports = {
  getUsersByDate,
  getUsersRoleComparison,
  getAdminRequestsByDate,
  getTranslationHistoryByUser,
  getAllStatistics
};