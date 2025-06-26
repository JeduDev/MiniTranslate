const jwt = require('jsonwebtoken');
const { client } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

async function verifyToken() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbjEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTA5NDEzNzcsImV4cCI6MTc1MTAyNzc3N30.8ofqcb6ktE3q-04r3BGqLP79ZWMbLzWp4rcT7qDBNmM';

  try {
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decodificado:', decoded);

    // Obtener información del usuario
    const userResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [decoded.id],
    });

    if (userResult.rows.length === 0) {
      console.log('No se encontró el usuario con ID:', decoded.id);
      process.exit(1);
    }

    console.log('\nInformación del usuario:', JSON.stringify(userResult.rows[0], null, 2));
    
    // Verificar si hay solicitudes de admin pendientes
    const requestsResult = await client.execute({
      sql: 'SELECT * FROM admin_requests WHERE read = "false"',
    });
    
    console.log('\nSolicitudes pendientes:', JSON.stringify(requestsResult.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error verificando el token:', error);
    process.exit(1);
  }
}

verifyToken(); 