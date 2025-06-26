const { client } = require('../config/db');

async function testDirectSql() {
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
    console.log('Datos del usuario antes de la actualización:', JSON.stringify(userResult.rows[0], null, 2));
    
    // Primero, asegurarse de que el usuario tenga rol "user"
    console.log(`\nAsegurando que el usuario ${userId} tenga rol 'user'...`);
    await client.execute(`UPDATE users SET role = "user" WHERE id = ${userId}`);
    
    // Verificar el estado inicial
    const initialState = await client.execute(`SELECT * FROM users WHERE id = ${userId}`);
    console.log('Estado inicial:', JSON.stringify(initialState.rows[0], null, 2));
    
    // Actualizar el rol a admin usando SQL literal
    console.log(`\nActualizando rol del usuario ${userId} a 'admin' con SQL literal...`);
    const updateResult = await client.execute(`UPDATE users SET role = "admin" WHERE id = ${userId}`);
    
    console.log(`Resultado de la actualización: rowsAffected=${updateResult.rowsAffected}`);
    
    // Verificar la actualización
    console.log('\nVerificando la actualización...');
    const verifyResult = await client.execute(`SELECT * FROM users WHERE id = ${userId}`);
    
    console.log('Datos del usuario después de la actualización:', JSON.stringify(verifyResult.rows[0], null, 2));
    
    console.log('\nPrueba completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la prueba:', error);
    process.exit(1);
  }
}

testDirectSql(); 