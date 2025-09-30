import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

import { useAuthStore } from '@store/auth.store';
import AuthScreen from '@screens/AuthScreen';
import ChatScreen from '@screens/ChatScreen';
import config from '@config/index';
import { logger } from '@utils/logger';
import { initializeAnalytics } from '@services/analytics.service';
import { initializeNotifications } from '@services/notifications.service';
import ErrorBoundary from '@components/ErrorBoundary';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Initialize Sentry
if (config.features.enableCrashReporting && config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.environment,
    debug: config.environment === 'development',
    tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
  });
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createStackNavigator();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const linking = {
  prefixes: [Linking.createURL('/'), 'betthink://'],
  config: {
    screens: {
      Auth: 'auth',
      Chat: 'chat/:chatId?',
      Settings: 'settings',
    },
  },
};

function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null; // Splash screen is still visible
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Chat" component={ChatScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize services
    if (config.features.enableAnalytics) {
      initializeAnalytics();
    }
    if (config.features.enablePushNotifications) {
      initializeNotifications();
    }

    // Handle deep links
    const handleDeepLink = (url: string) => {
      logger.info('Deep link received', { url });
      // Handle the deep link navigation
    };

    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer linking={linking}>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}