const fetch = require('node-fetch');

// Función para enviar una notificación de prueba
async function sendTestNotification(token) {
  try {
    // Limpiar el token
    const cleanToken = token.trim().replace(/\s+/g, '');
    console.log(`Token limpio: ${cleanToken}`);

    const message = {
      to: cleanToken,
      sound: 'default',
      title: 'Prueba de Notificación',
      body: 'Esta es una notificación de prueba enviada directamente desde el script.',
      data: { type: 'test_notification' }
    };

    console.log('Enviando mensaje:', JSON.stringify(message));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const responseData = await response.json();
    console.log('Respuesta de Expo:', JSON.stringify(responseData, null, 2));
    
    return responseData;
  } catch (error) {
    console.error('Error enviando notificación de prueba:', error);
  }
}

// Obtener el token de los argumentos de la línea de comandos
const token = process.argv[2];

if (!token) {
  console.error('Error: Debes proporcionar un token como argumento.');
  console.log('Uso: node test-notification.js "ExponentPushToken[...]"');
  process.exit(1);
}

sendTestNotification(token)
  .then(() => {
    console.log('Prueba completada.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en la prueba:', error);
    process.exit(1);
  }); 