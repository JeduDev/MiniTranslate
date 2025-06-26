const { client } = require('../config/db');

async function checkAdminRequest() {
  try {
    // Obtener todas las solicitudes de administrador
    console.log('Obteniendo solicitudes de administrador...');
    const requestsResult = await client.execute(`
      SELECT ar.id as requestId, ar.user_id, ar.read, u.id, u.name, u.email, u.role 
      FROM admin_requests ar
      JOIN users u ON ar.user_id = u.id
    `);
    
    if (requestsResult.rows.length === 0) {
      console.log('No se encontraron solicitudes de administrador en la base de datos.');
      process.exit(0);
    }
    
    console.log(`Se encontraron ${requestsResult.rows.length} solicitudes:`);
    
    for (const request of requestsResult.rows) {
      console.log('\n---------------------------------------');
      console.log(`Solicitud ID: ${request.requestId}`);
      console.log(`Usuario ID: ${request.user_id}`);
      console.log(`Estado de lectura: ${request.read}`);
      console.log(`Nombre de usuario: ${request.name}`);
      console.log(`Email: ${request.email}`);
      console.log(`Rol actual: ${request.role}`);
      console.log('---------------------------------------');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error durante la verificación:', error);
    process.exit(1);
  }
}

checkAdminRequest();
