import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configurar el manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Función para enviar notificaciones directamente desde el cliente
export const sendPushNotifications = async (
  tokens: string[],
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  try {
    const validTokens = tokens.filter(token => 
      token && token.trim() !== '' && 
      token.startsWith('ExponentPushToken[') && 
      token.endsWith(']')
    );

    if (validTokens.length === 0) {
      console.log('No hay tokens válidos para enviar notificaciones');
      return;
    }

    // Enviar notificaciones a cada token
    const promises = validTokens.map(token => {
      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data
      };

      return fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })
      .then(response => response.json())
      .then(data => {
        console.log(`Notificación enviada a ${token}:`, data);
        return data;
      })
      .catch(error => {
        console.error(`Error enviando notificación a ${token}:`, error);
        throw error;
      });
    });

    await Promise.all(promises);
    console.log('Todas las notificaciones han sido enviadas');
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
    throw error;
  }
};

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        console.log('==============================================');
        console.log('PUSH TOKEN OBTENIDO:', token);
        console.log('==============================================');
        AsyncStorage.setItem('pushToken', token).then(() => {
          console.log('Push token guardado en AsyncStorage');
          // Verificar que se guardó correctamente
          AsyncStorage.getItem('pushToken').then(storedToken => {
            console.log('Push token recuperado de AsyncStorage:', storedToken);
          });
        });
      } else {
        console.log('No se pudo obtener el push token');
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    return () => {
      notificationListener.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;
  
  if (!Device.isDevice) {
    console.log('Las notificaciones push requieren un dispositivo físico');
    return;
  }
  // Verificar y solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    console.log('Solicitando permisos para notificaciones push...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('Estado de permisos después de solicitar:', finalStatus);
  } else {
    console.log('Permisos para notificaciones push ya concedidos');
  }
  
  if (finalStatus !== 'granted') {
    console.log('ERROR: Permisos para notificaciones push denegados');
    return;
  }
  
  try {
    console.log('Obteniendo token de Expo...');
    
    // Intentar obtener un token de Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (projectId) {
      // Si hay un projectId configurado, usar getExpoPushTokenAsync
      console.log('Usando projectId configurado:', projectId);
      const { data } = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      token = data;
    } else {
      // Si no hay projectId, intentar obtener un token de desarrollo
      console.log('No hay projectId configurado, usando token de desarrollo');
      try {
        // En desarrollo, podemos usar este método
        const { data: devicePushToken } = await Notifications.getDevicePushTokenAsync();
        token = devicePushToken;
        console.log('Token de dispositivo obtenido:', token);
      } catch (deviceError) {
        console.error('Error al obtener token de dispositivo:', deviceError);
        return;
      }
    }
    
    if (!token) {
      console.error('No se pudo obtener un token de notificaciones');
      return;
    }
    
    console.log('Token de notificaciones obtenido correctamente:', token);
  } catch (error) {
    console.error('Error al obtener el token de notificaciones:', error);
    return;
  }

  // Configurar canal para Android
  if (Platform.OS === 'android') {
    console.log('Configurando canal de notificaciones para Android...');
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
} 