const { client } = require('../config/db');

async function resetUserRole() {
  try {
    // Obtener el usuario Jesusito
    console.log('Obteniendo el usuario Jesusito...');
    const userResult = await client.execute('SELECT * FROM users WHERE name = "Jesusito" LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('No se encontró el usuario Jesusito en la base de datos.');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Usuario encontrado con ID: ${userId}`);
    console.log('Datos del usuario antes del reset:', JSON.stringify(userResult.rows[0], null, 2));
    
    // Restablecer el rol a user
    console.log(`\nRestableciendo rol del usuario ${userId} a 'user'...`);
    const updateResult = await client.execute({
      sql: "UPDATE users SET role = 'user' WHERE id = ?",
      args: [userId],
    });
    
    console.log(`Resultado del reset: rowsAffected=${updateResult.rowsAffected}`);
    
    // Verificar la actualización
    console.log('\nVerificando el reset...');
    const verifyResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId],
    });
    
    console.log('Datos del usuario después del reset:', JSON.stringify(verifyResult.rows[0], null, 2));
    
    // Restablecer también el estado de la solicitud
    console.log('\nRestableciendo el estado de la solicitud de administrador...');
    const requestResult = await client.execute({
      sql: "UPDATE admin_requests SET read = 'false' WHERE user_id = ?",
      args: [userId],
    });
    
    console.log(`Resultado del reset de solicitud: rowsAffected=${requestResult.rowsAffected}`);
    
    console.log('\nReset completado.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el reset:', error);
    process.exit(1);
  }
}

resetUserRole(); 