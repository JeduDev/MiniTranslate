const fetch = require('node-fetch');

async function testApproveRequest() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbjEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTA5NDEzNzcsImV4cCI6MTc1MTAyNzc3N30.8ofqcb6ktE3q-04r3BGqLP79ZWMbLzWp4rcT7qDBNmM';
  const userId = 1;  // ID del usuario Jesusito
  const requestId = 10;  // ID de la solicitud pendiente

  try {
    console.log('Enviando solicitud para aprobar el usuario como administrador...');
    
    const response = await fetch('http://localhost:3000/api/admin/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId, requestId })
    });

    const data = await response.json();
    
    console.log('\nCódigo de respuesta:', response.status);
    console.log('Respuesta:', JSON.stringify(data, null, 2));
    
    console.log('\nVerificando el estado del usuario después de la aprobación...');
    const { client } = require('../config/db');
    const userResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId],
    });
    
    console.log('Estado del usuario:', JSON.stringify(userResult.rows[0], null, 2));
    
    const requestResult = await client.execute({
      sql: 'SELECT * FROM admin_requests WHERE id = ?',
      args: [requestId],
    });
    
    console.log('Estado de la solicitud:', JSON.stringify(requestResult.rows[0], null, 2));
    
    console.log('\nPrueba completada.');
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

testApproveRequest(); 