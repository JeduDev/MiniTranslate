const { client } = require('../config/db');

async function checkAdminTokens() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Verificar todos los usuarios
    const allUsers = await client.execute('SELECT id, name, email, role, push_token FROM users');
    console.log('\n--- TODOS LOS USUARIOS ---');
    console.log(`Total de usuarios: ${allUsers.rows.length}`);
    allUsers.rows.forEach(user => {
      console.log(`ID: ${user.id}, Nombre: ${user.name}, Email: ${user.email}, Rol: ${user.role}, Token: ${user.push_token || 'NO TOKEN'}`);
    });

    // Verificar específicamente los administradores
    const admins = await client.execute("SELECT id, name, email, push_token FROM users WHERE role = 'admin'");
    console.log('\n--- ADMINISTRADORES ---');
    console.log(`Total de administradores: ${admins.rows.length}`);
    admins.rows.forEach(admin => {
      console.log(`ID: ${admin.id}, Nombre: ${admin.name}, Email: ${admin.email}, Token: ${admin.push_token || 'NO TOKEN'}`);
    });

    // Verificar solicitudes de administrador
    const requests = await client.execute('SELECT * FROM admin_requests');
    console.log('\n--- SOLICITUDES DE ADMINISTRADOR ---');
    console.log(`Total de solicitudes: ${requests.rows.length}`);
    for (const req of requests.rows) {
      const user = await client.execute({
        sql: 'SELECT name, email FROM users WHERE id = ?',
        args: [req.user_id]
      });
      const userName = user.rows[0]?.name || 'Usuario desconocido';
      const userEmail = user.rows[0]?.email || 'Email desconocido';
      console.log(`ID: ${req.id}, Usuario: ${userName} (${userEmail}), Leída: ${req.read}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error verificando tokens de administradores:', error);
    process.exit(1);
  }
}

checkAdminTokens(); 