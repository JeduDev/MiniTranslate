const { client } = require('../config/db');

async function testDirectUpdate() {
  try {
    // Obtener el primer usuario
    console.log('Obteniendo el primer usuario...');
    const userResult = await client.execute('SELECT * FROM users WHERE name = "Jesusito" LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('No se encontró el usuario Jesusito en la base de datos.');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Usuario encontrado con ID: ${userId}`);
    console.log('Datos del usuario antes de la actualización:', JSON.stringify(userResult.rows[0], null, 2));
    
    // Actualizar el rol a admin usando la nueva sintaxis
    console.log(`\nActualizando rol del usuario ${userId} a 'admin' con nueva sintaxis...`);
    const updateResult = await client.execute({
      sql: "UPDATE users SET role = 'admin' WHERE id = ?",
      args: [userId],
    });
    
    console.log(`Resultado de la actualización: rowsAffected=${updateResult.rowsAffected}`);
    
    // Verificar la actualización
    console.log('\nVerificando la actualización...');
    const verifyResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId],
    });
    
    console.log('Datos del usuario después de la actualización:', JSON.stringify(verifyResult.rows[0], null, 2));
    
    console.log('\nPrueba completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la prueba:', error);
    process.exit(1);
  }
}

testDirectUpdate(); 