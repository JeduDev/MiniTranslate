import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="translate"
        options={{
          title: 'Traducir',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <Ionicons name="time" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Peticiones',
            tabBarIcon: ({ color }) => <Ionicons name="list" size={28} color={color} />,
          }}
        />
      )}
      {isAdmin && (
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Estadísticas',
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={28} color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}
