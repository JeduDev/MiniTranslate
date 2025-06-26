const jwt = require('jsonwebtoken');
const { client } = require('../config/db');
const { JWT_SECRET } = require('./auth');

async function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    
    const userResult = await client.execute({
        sql: 'SELECT role FROM users WHERE id = ?',
        args: [verified.id]
    });

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

module.exports = { adminAuth }; 