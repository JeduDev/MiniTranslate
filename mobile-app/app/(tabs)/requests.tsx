import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect } from 'expo-router';
import { sendPushNotifications } from '@/hooks/usePushNotifications';

interface AdminRequest {
  id: number;
  name: string;
  email: string;
  requestId: number;
}

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const { token } = useAuth();

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://192.168.1.2:3000/api/admin/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRequests(data);
      } else {
        Alert.alert('Error', data.message || 'No se pudieron cargar las solicitudes.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchRequests();
      }
    }, [token])
  );

  const handleApprove = async (userId: number, requestId: number) => {
    try {
      // 1. Aprobar la solicitud en el servidor
      console.log(`Aprobando solicitud: userId=${userId}, requestId=${requestId}`);
      const response = await fetch('http://192.168.1.2:3000/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, requestId }),
      });
      
      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Respuesta no es JSON:', text);
        throw new Error('El servidor no respondió con JSON: ' + text.substring(0, 100));
      }
      
      const data = await response.json();
      console.log('Respuesta de aprobación:', data);
      
      if (response.ok) {
        try {
          // 2. Obtener el token del usuario aprobado
          console.log(`Obteniendo token para usuario ${userId}`);
          const userResponse = await fetch(`http://192.168.1.2:3000/api/users/${userId}/push-token`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          // Verificar si la respuesta es JSON
          const userContentType = userResponse.headers.get('content-type');
          if (!userContentType || !userContentType.includes('application/json')) {
            const text = await userResponse.text();
            console.error('Respuesta de token no es JSON:', text);
            throw new Error('El servidor no respondió con JSON al obtener el token');
          }
          
          const userData = await userResponse.json();
          console.log('Datos de token del usuario:', userData);
          
          if (userResponse.ok && userData.pushToken) {
            // 3. Enviar notificación al usuario
            console.log(`Enviando notificación a token: ${userData.pushToken}`);
            await sendPushNotifications(
              [userData.pushToken],
              '¡Felicidades!',
              'Tu solicitud para ser administrador ha sido aprobada.',
              { type: 'admin_approved' }
            );
            console.log('Notificación enviada al usuario aprobado');
          } else {
            console.log('El usuario no tiene un token válido para notificar');
          }
        } catch (notificationError) {
          console.error('Error enviando notificación:', notificationError);
          // No bloqueamos el flujo principal si falla la notificación
        }
        
        Alert.alert('Éxito', data.message);
        fetchRequests(); // Recargar la lista
      } else {
        Alert.alert('Error', data.message || 'No se pudo aprobar la solicitud.');
      }
    } catch (error) {
      console.error('Error durante la aprobación:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Ocurrió un error de red.');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch('http://192.168.1.2:3000/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Éxito', data.message);
        fetchRequests(); // Recargar la lista
      } else {
        Alert.alert('Error', data.message || 'No se pudo rechazar la solicitud.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error de red.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Peticiones de Administrador</ThemedText>
      {requests.length > 0 ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.requestItem}>
              <View>
                <ThemedText style={styles.name}>{item.name}</ThemedText>
                <ThemedText style={styles.email}>{item.email}</ThemedText>
              </View>
              <View style={styles.buttonsContainer}>
                <Button title="Aprobar" onPress={() => handleApprove(item.id, item.requestId)} />
                <Button title="Rechazar" onPress={() => handleReject(item.requestId)} color="red" />
              </View>
            </View>
          )}
        />
      ) : (
        <ThemedText style={styles.noRequestsText}>No hay solicitudes pendientes.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  name: {
    fontWeight: 'bold',
  },
  email: {
    color: '#555',
  },
  noRequestsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  }
}); 