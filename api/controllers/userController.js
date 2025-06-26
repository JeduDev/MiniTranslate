const { client } = require('../config/db');
const fetch = require('node-fetch');

// Función para enviar notificaciones usando fetch en lugar del SDK de Expo
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    // Limpiar el token de espacios, saltos de línea, etc.
    const cleanToken = pushToken.trim().replace(/\s+/g, '');
    
    // Verificar que el token tenga el formato correcto
    if (!cleanToken.startsWith('ExponentPushToken[') || !cleanToken.endsWith(']')) {
      console.error(`Token inválido: ${cleanToken}`);
      return { error: 'Token inválido' };
    }
    
    const message = {
      to: cleanToken,
      sound: 'default',
      title,
      body,
      data
    };

    console.log(`Intentando enviar notificación a token limpio: ${cleanToken}`);
    console.log('Mensaje:', JSON.stringify(message));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const responseData = await response.json();
    console.log('Respuesta de Expo:', JSON.stringify(responseData));
    return responseData;
  } catch (error) {
    console.error('Error enviando notificación:', error);
    throw error;
  }
};

const requestAdminAccess = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Obtener datos del usuario que solicita
    const userResult = await client.execute({
      sql: 'SELECT name, role FROM users WHERE id = ?',
      args: [userId],
    });

    if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    const currentUser = userResult.rows[0];
    
    // Verificar si el usuario ya es admin
    if (currentUser.role === 'admin') {
      return res.status(400).json({ message: 'Ya eres un administrador.' });
    }

    // Verificar si ya existe una solicitud para este usuario
    const requestResult = await client.execute({
      sql: 'SELECT id FROM admin_requests WHERE user_id = ?',
      args: [userId],
    });

    if (requestResult.rows.length > 0) {
      return res.status(400).json({ message: 'Ya tienes una solicitud pendiente.' });
    }

    // Insertar la solicitud de admin
    await client.execute({
      sql: 'INSERT INTO admin_requests (user_id) VALUES (?)',
      args: [userId],
    });

    // Ya no enviamos notificaciones desde el servidor
    // El cliente se encargará de enviar las notificaciones

    res.status(201).json({ 
      message: 'Solicitud para ser administrador enviada correctamente.',
      userName: currentUser.name // Enviamos el nombre para que el cliente lo use en la notificación
    });
  } catch (error) {
    console.error('Error al solicitar acceso de administrador:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const getUserPushToken = async (req, res) => {
  const userId = req.params.userId;
  
  console.log(`Obteniendo token para usuario ${userId}`);

  try {
    const userResult = await client.execute({
      sql: 'SELECT push_token FROM users WHERE id = ?',
      args: [userId],
    });
    
    console.log(`Resultado de consulta de token: ${JSON.stringify(userResult.rows)}`);

    if (userResult.rows.length === 0) {
      console.log(`Usuario ${userId} no encontrado`);
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const pushToken = userResult.rows[0].push_token;
    console.log(`Token original: ${pushToken}`);
    
    // Limpiar el token si existe
    const cleanToken = pushToken ? pushToken.trim().replace(/\s+/g, '') : null;
    console.log(`Token limpio: ${cleanToken}`);

    const response = { 
      pushToken: cleanToken,
      valid: cleanToken && cleanToken.startsWith('ExponentPushToken[') && cleanToken.endsWith(']')
    };
    
    console.log(`Respuesta final: ${JSON.stringify(response)}`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error obteniendo token de usuario:', error);
    // Asegurar que siempre devolvemos JSON incluso en caso de error
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  requestAdminAccess,
  getUserPushToken,
}; 