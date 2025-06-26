const { client } = require('../config/db');

async function resetState() {
  try {
    console.log('Restableciendo rol del usuario a "user"...');
    await client.execute('UPDATE users SET role = "user" WHERE id = 1');
    
    console.log('Restableciendo estado de la solicitud a "false"...');
    await client.execute('UPDATE admin_requests SET read = "false" WHERE user_id = 1');
    
    // Verificar el estado final
    const userResult = await client.execute('SELECT * FROM users WHERE id = 1');
    const requestResult = await client.execute('SELECT * FROM admin_requests WHERE user_id = 1');
    
    console.log('\nEstado final del usuario:', JSON.stringify(userResult.rows[0], null, 2));
    console.log('Estado final de la solicitud:', JSON.stringify(requestResult.rows[0], null, 2));
    
    console.log('\nRestablecimiento completado.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el restablecimiento:', error);
    process.exit(1);
  }
}

resetState(); 