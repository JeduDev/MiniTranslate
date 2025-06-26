import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '../context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { API_URL } from '@/constants/api';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { login } = useAuth();

  // Get theme colors
  const colorScheme = useThemeColor({}, 'background') === Colors.light.background ? 'light' : 'dark';
  const borderColor = colorScheme === 'light' ? '#ccc' : '#333';
  const inputBgColor = colorScheme === 'light' ? '#fff' : '#222';
  const placeholderColor = colorScheme === 'light' ? '#999' : '#777';
  const textColor = useThemeColor({}, 'text');
  const primaryColor = '#0a84ff';

  // Check for push token on component mount
  useEffect(() => {
    const checkPushToken = async () => {
      try {
        const token = await AsyncStorage.getItem('pushToken');
        setPushToken(token);
        console.log('Push token en RegisterScreen:', token);
      } catch (e) {
        console.error('Error al recuperar el push token:', e);
      }
    };
    
    checkPushToken();
  }, []);

  const handleRegister = async () => {
    // Reset error message
    setErrorMessage('');
    
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Get push token if available
      let currentPushToken = pushToken;
      if (!currentPushToken) {
        try {
          currentPushToken = await AsyncStorage.getItem('pushToken') || '';
          setPushToken(currentPushToken);
          console.log('Push token recuperado de AsyncStorage:', currentPushToken);
        } catch (e) {
          console.error('Error al recuperar el push token:', e);
        }
      }

      const userData = {
        name,
        email,
        password,
        push_token: currentPushToken,
      };
      
      console.log(`Intentando registrar usuario: ${email}`);
      console.log('Datos enviados:', JSON.stringify(userData, null, 2));
      console.log(`URL de la API: ${API_URL}/api/auth/register`);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Estado de la respuesta:', response.status);
      const data = await response.json();
      console.log('Respuesta del servidor:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        if (data.error === 'User already exists with this email') {
          throw new Error('Ya existe un usuario con este correo electrónico');
        } else {
          throw new Error(data.error || data.details || 'Error en el registro');
        }
      }

      console.log('Registro exitoso, datos del usuario:', JSON.stringify(data.user, null, 2));
      
      // Use the auth context to log in
      await login(data.token, data.user);

      // Navigate to the main app
      router.replace('/(tabs)/translate');
    } catch (error: any) {
      console.error('Error de registro:', error);
      setErrorMessage(error.message || 'Error al registrar. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Crear Cuenta</ThemedText>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
            placeholder="Nombre"
            placeholderTextColor={placeholderColor}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
            placeholder="Correo"
            placeholderTextColor={placeholderColor}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
            placeholder="Contraseña"
            placeholderTextColor={placeholderColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={[styles.input, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
            placeholder="Confirmar"
            placeholderTextColor={placeholderColor}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Registrar</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={navigateToLogin} style={styles.loginButton}>
            <ThemedText style={styles.loginText}>¿Ya tienes cuenta?</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0a84ff',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginButton: {
    marginTop: 20,
    padding: 10,
  },
  loginText: {
    color: '#0a84ff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
  },
}); 