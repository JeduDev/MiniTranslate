const { Expo } = require('expo-server-sdk');
const { client } = require('../config/db');

const expo = new Expo();

const savePushToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id; // Asumiendo que el middleware de auth añade el usuario al request

  if (!token) {
    return res.status(400).json({ message: 'Token es requerido' });
  }

  try {
    await client.transaction(async (tx) => {
      // 1. Limpiar el token de cualquier otro usuario que pudiera tenerlo.
      // Esto asegura que cada token de dispositivo sea único para un solo usuario.
      await tx.execute({
        sql: 'UPDATE users SET push_token = NULL WHERE push_token = ?',
        args: [token],
      });

      // 2. Asignar el nuevo token al usuario que acaba de iniciar sesión.
      await tx.execute({
        sql: 'UPDATE users SET push_token = ? WHERE id = ?',
        args: [token, userId],
      });
    });

    res.status(200).json({ message: 'Token guardado exitosamente' });
  } catch (error) {
    // El rollback es automático si la transacción falla.
    console.error('Error guardando el push token:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const sendTestNotification = async (req, res) => {
  const userId = req.user.id; // Asumiendo que el middleware de auth añade el usuario al request

  try {
    // Obtener el push token del usuario desde la base de datos
    const userResult = await client.execute({
      sql: 'SELECT push_token FROM users WHERE id = ?',
      args: [userId],
    });

    const pushToken = userResult.rows[0]?.push_token;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      console.error(`El token de push para el usuario ${userId} no es válido o no existe.`);
      return res.status(400).json({ message: 'El token de notificación del usuario no es válido.' });
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title: 'Notificación de Prueba',
      body: '¡Si ves esto, las notificaciones push funcionan!',
      data: { withSome: 'data' },
    };

    // Enviar la notificación
    await expo.sendPushNotificationsAsync([message]);

    res.status(200).json({ message: 'Notificación de prueba enviada.' });
  } catch (error) {
    console.error('Error enviando la notificación de prueba:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getAdminPushTokens = async (req, res) => {
  try {
    // Obtener los tokens de todos los administradores
    const adminsResult = await client.execute({
      sql: "SELECT push_token FROM users WHERE role = 'admin' AND push_token IS NOT NULL",
      args: [],
    });

    // Filtrar tokens vacíos o inválidos
    const adminTokens = adminsResult.rows
      .map(row => row.push_token)
      .filter(token => token && token.trim() !== '')
      .map(token => token.trim().replace(/\s+/g, ''))
      .filter(token => token.startsWith('ExponentPushToken[') && token.endsWith(']'));

    res.status(200).json({ tokens: adminTokens });
  } catch (error) {
    console.error('Error obteniendo tokens de administradores:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const notifyAdminsUserLimitReached = async (req, res) => {
  const { userName, userId } = req.body;
  const requestingUserId = req.user.id;

  // Verify that the user ID in the token matches the user ID in the request
  if (requestingUserId !== userId) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    // Get all admin tokens
    const adminsResult = await client.execute({
      sql: "SELECT push_token FROM users WHERE role = 'admin' AND push_token IS NOT NULL",
      args: [],
    });

    // Filter valid tokens
    const adminTokens = adminsResult.rows
      .map(row => row.push_token)
      .filter(token => token && token.trim() !== '')
      .filter(token => Expo.isExpoPushToken(token));

    if (adminTokens.length === 0) {
      return res.status(200).json({ message: 'No hay administradores con tokens de notificación válidos' });
    }

    // Create notification messages
    const messages = adminTokens.map(token => ({
      to: token,
      sound: 'default',
      title: 'Usuario alcanzó límite de traducciones',
      body: `El usuario ${userName} ha alcanzado su límite de traducciones`,
      data: { 
        type: 'user_limit_reached',
        userId: userId,
        userName: userName
      },
      priority: 'high',
    }));

    // Send notifications
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending notifications chunk:', error);
      }
    }

    res.status(200).json({ 
      message: 'Notificaciones enviadas a los administradores',
      sentTo: adminTokens.length
    });
  } catch (error) {
    console.error('Error enviando notificaciones a administradores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  savePushToken,
  sendTestNotification,
  getAdminPushTokens,
  notifyAdminsUserLimitReached,
}; 