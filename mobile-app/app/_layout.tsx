import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { HistoryProvider } from '@/context/HistoryContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { RateLimitProvider } from '@/context/RateLimitContext';
import usePushNotifications from '@/hooks/usePushNotifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Auth protection for routes
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if trying to access protected routes while not authenticated
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup && segments[0] !== 'modal') {
      // Redirect to home if already authenticated and trying to access auth routes
      router.replace('/(tabs)/translate');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return <>{children}</>;
}

// Initialize push notifications
function PushNotificationsInit({ children }: { children: React.ReactNode }) {
  // This will register for push notifications and store the token
  usePushNotifications();
  
  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <HistoryProvider>
          <RateLimitProvider>
            <PushNotificationsInit>
              <AuthGuard>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="register" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
                </Stack>
                <StatusBar style="auto" />
              </AuthGuard>
            </PushNotificationsInit>
          </RateLimitProvider>
        </HistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
