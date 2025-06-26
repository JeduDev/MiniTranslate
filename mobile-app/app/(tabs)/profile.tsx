import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, View, ScrollView, Share, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { sendPushNotifications } from '@/hooks/usePushNotifications';
import { API_URL } from '@/constants/api';

export default function ProfileScreen() {
  const { user, token, logout, sendTestNotification, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  // Get theme colors
  const colorScheme = useThemeColor({}, 'background') === Colors.light.background ? 'light' : 'dark';
  const borderColor = colorScheme === 'light' ? '#ccc' : '#333';
  const cardBgColor = colorScheme === 'light' ? '#f9f9f9' : '#222';
  const textColor = useThemeColor({}, 'text');
  const primaryColor = '#0a84ff';

  useEffect(() => {
    if (!user || !token) {
      router.replace('/login');
      return;
    }

    fetchProfileData();
    fetchPushToken();
  }, [user, token]);

  const fetchProfileData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener el perfil');
      }

      setProfileData(data.user);
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPushToken = async () => {
    setIsLoadingToken(true);
    try {
      const storedToken = await AsyncStorage.getItem('pushToken');
      setPushToken(storedToken);
      console.log('Push token recuperado en perfil:', storedToken);
    } catch (error) {
      console.error('Error al recuperar el push token:', error);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleShareToken = async () => {
    if (pushToken) {
      try {
        await Share.share({
          message: `Mi token de notificaciones push: ${pushToken}`,
        });
      } catch (error) {
        console.error('Error al compartir el token:', error);
      }
    }
  };

  const handleRequestAdmin = async () => {
    if (!token) {
      Alert.alert('Error', 'Debes estar autenticado para hacer esto.');
      return;
    }
    Alert.alert(
      "Confirmar solicitud",
      "¿Estás seguro de que quieres solicitar privilegios de administrador?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, solicitar", 
          onPress: async () => {
            try {
              // 1. Enviar la solicitud al servidor
              const response = await fetch(`${API_URL}/api/users/request-admin`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.message || 'Error al enviar la solicitud.');
              }

              // 2. Obtener los tokens de los administradores
              const tokensResponse = await fetch(`${API_URL}/api/notifications/admin-tokens`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const tokensData = await tokensResponse.json();
              
              if (tokensResponse.ok && tokensData.tokens && tokensData.tokens.length > 0) {
                // 3. Enviar notificaciones a los administradores
                await sendPushNotifications(
                  tokensData.tokens,
                  'Nueva Solicitud de Administrador',
                  `El usuario ${user?.name} ha solicitado privilegios de administrador.`,
                  { type: 'new_admin_request' }
                );
                console.log('Notificaciones enviadas a los administradores');
              } else {
                console.log('No hay administradores con tokens válidos para notificar');
              }

              Alert.alert('Éxito', data.message);
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Ocurrió un error');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Sí, cerrar sesión", 
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Mi Perfil</ThemedText>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={primaryColor} style={styles.loader} />
        ) : (
          <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarContainer, { backgroundColor: primaryColor }]}>
                <ThemedText style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </ThemedText>
              </View>
              <ThemedText style={styles.userName}>{user.name}</ThemedText>
            </View>
            
            <View style={styles.infoContainer}>
              <ThemedText style={styles.infoLabel}>Correo electrónico:</ThemedText>
              <ThemedText style={styles.infoValue}>{user.email}</ThemedText>
            </View>
            
            <View style={styles.infoContainer}>
              <ThemedText style={styles.infoLabel}>ID de usuario:</ThemedText>
              <ThemedText style={styles.infoValue}>{user.id}</ThemedText>
            </View>
          </View>
        )}

        {/* Sección de token de notificaciones */}
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Token de Notificaciones</ThemedText>
          
          {isLoadingToken ? (
            <ActivityIndicator size="small" color={primaryColor} style={styles.tokenLoader} />
          ) : pushToken ? (
            <>
              <View style={styles.tokenContainer}>
                <ThemedText style={styles.tokenText}>{pushToken}</ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={handleShareToken}
              >
                <ThemedText style={styles.shareButtonText}>Compartir Token</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <ThemedText style={styles.noTokenText}>No se ha encontrado un token de notificaciones</ThemedText>
          )}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutButtonText}>Cerrar sesión</ThemedText>
        </TouchableOpacity>
        
        {!isAdmin && (
          <TouchableOpacity style={[styles.button, styles.requestAdminButton]} onPress={handleRequestAdmin}>
            <ThemedText style={styles.buttonText}>Solicitar ser Administrador</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  loader: {
    marginVertical: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 120,
  },
  infoValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tokenContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tokenText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tokenLoader: {
    marginVertical: 12,
  },
  noTokenText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  shareButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ff6347',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '80%',
  },
  testButton: {
    backgroundColor: '#1e90ff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  requestAdminButton: {
    backgroundColor: '#34C759', // Un color verde para la acción de solicitar
    marginTop: 10,
  }
}); 