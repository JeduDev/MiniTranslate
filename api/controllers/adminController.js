const { client } = require('../config/db');

const getAdminRequests = async (req, res) => {
  try {
    const result = await client.execute(`
        SELECT u.id, u.name, u.email, ar.id as requestId 
        FROM users u
        JOIN admin_requests ar ON u.id = ar.user_id
        WHERE ar.read = 'false'
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const approveAdminRequest = async (req, res) => {
  const { userId, requestId } = req.body;

  console.log(`Recibida solicitud para aprobar: userId=${userId}, requestId=${requestId}`);

  if (!userId || !requestId) {
    return res.status(400).json({ message: 'User ID y Request ID son requeridos' });
  }

  try {
    // Verificar el usuario antes de cualquier modificación
    const userBefore = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId],
    });
    
    console.log('USUARIO ANTES DE MODIFICACIÓN:', JSON.stringify(userBefore.rows[0], null, 2));
    
    // Verificar que la solicitud no haya sido procesada
    console.log(`Verificando estado de la solicitud ${requestId}...`);
    const requestCheck = await client.execute({
      sql: 'SELECT read FROM admin_requests WHERE id = ?',
      args: [requestId],
    });

    console.log(`Resultado de verificación: ${JSON.stringify(requestCheck.rows)}`);

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ message: 'La solicitud no existe.' });
    }
    if (requestCheck.rows[0].read === 'true') {
      return res.status(400).json({ message: 'Esta solicitud ya ha sido procesada.' });
    }

    // Verificar el rol actual del usuario
    console.log(`Verificando rol actual del usuario ${userId}...`);
    const userCheck = await client.execute({
      sql: 'SELECT role FROM users WHERE id = ?',
      args: [userId],
    });
    
    console.log(`Rol actual del usuario: ${JSON.stringify(userCheck.rows)}`);

    // PASO 1: Actualizar el rol del usuario a 'admin' - DIRECTAMENTE SIN TRANSACCIÓN
    console.log(`Actualizando rol del usuario ${userId} a 'admin'...`);
    console.log('SQL a ejecutar: UPDATE users SET role = "admin" WHERE id = ?');
    
    // Intentamos con comillas dobles para el valor
    const updateUser = await client.execute(`UPDATE users SET role = "admin" WHERE id = ${userId}`);

    console.log(`Resultado de la actualización: rowsAffected=${updateUser.rowsAffected}`);
    console.log('Detalles completos de la actualización:', JSON.stringify(updateUser, null, 2));

    if (updateUser.rowsAffected === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // PASO 2: Marcar la solicitud como leída - TAMBIÉN DIRECTAMENTE
    console.log(`Marcando solicitud ${requestId} como leída...`);
    await client.execute(`UPDATE admin_requests SET read = 'true' WHERE id = ${requestId}`);
    console.log('Solicitud marcada como leída exitosamente');

    // Verificar que el rol se haya actualizado correctamente
    console.log(`Verificando la actualización del rol para el usuario ${userId}...`);
    const verifyUpdate = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId],
    });
    console.log(`USUARIO DESPUÉS DE LA ACTUALIZACIÓN:`, JSON.stringify(verifyUpdate.rows[0], null, 2));

    // Ya no enviamos notificaciones desde el servidor
    // El cliente se encargará de enviar las notificaciones

    res.status(200).json({ message: 'Usuario actualizado a administrador exitosamente.' });
  } catch (error) {
    console.error('Error aprobando la solicitud de admin:', error);
    res.status(500).json({ message: error.message || 'Error interno del servidor' });
  }
};

const rejectAdminRequest = async (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ message: 'Request ID es requerido' });
    }

    try {
        // Marcar la solicitud como leída sin cambiar el rol usando SQL literal
        console.log(`Rechazando solicitud ${requestId}...`);
        const updateRequest = await client.execute(`UPDATE admin_requests SET read = 'true' WHERE id = ${requestId}`);

        if (updateRequest.rowsAffected === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada.' });
        }

        res.status(200).json({ message: 'Solicitud rechazada exitosamente.' });
    } catch (error) {
        console.error('Error rechazando la solicitud de admin:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
  getAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
}; 