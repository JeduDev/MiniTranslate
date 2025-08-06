import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '@/constants/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsAdmin(parsedUser.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      setIsAdmin(newUser.role === 'admin');

      // Guardar el push token después de iniciar sesión
      const pushToken = await AsyncStorage.getItem('pushToken');
      if (pushToken) {
        await savePushToken(pushToken, newToken);
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Llamar al endpoint de logout si hay un token
      if (token) {
        try {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('Logout en el servidor exitoso');
        } catch (serverError) {
          console.error('Error en el logout del servidor:', serverError);
          // Continuamos con el logout local aunque falle en el servidor
        }
      }

      // Limpiar el almacenamiento local
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Actualizar el estado
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const savePushToken = async (pushToken: string, authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ token: pushToken })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el push token');
      }

      console.log('Push token guardado en el backend exitosamente.');

    } catch (error) {
      console.error('Error al enviar el push token al backend:', error);
    }
  };

  const sendTestNotification = async () => {
    if (!token) {
      console.log('No hay token de autenticación para enviar la notificación.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la notificación de prueba');
      }

      console.log('Solicitud de notificación de prueba enviada.');
      alert('Notificación de prueba enviada. Deberías recibirla en breve.');

    } catch (error) {
      console.error('Error al enviar la notificación de prueba:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Ocurrió un error.'}`);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        user, 
        token,
        isAdmin,
        login, 
        logout, 
        updateUser,
        sendTestNotification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};