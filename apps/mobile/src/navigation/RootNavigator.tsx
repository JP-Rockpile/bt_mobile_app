import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/stores/auth.store';
import { sentryRoutingInstrumentation } from '@/services/error-tracking.service';
import { AuthScreen } from '@/screens/AuthScreen';
import { MainNavigator } from './MainNavigator';
import { ChatScreen } from '@/screens/ChatScreen';
import type { RootStackParamList } from './types';
import { logger } from '@/utils/logger';

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL('/');

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const linking = {
    prefixes: [prefix, 'betthink://', 'https://betthink.app'],
    config: {
      screens: {
        Auth: 'auth',
        Main: {
          screens: {
            Home: 'home',
            History: 'history',
            Settings: 'settings',
          },
        },
        ChatDetail: 'chat/:threadId',
      },
    },
  };

  const onReady = () => {
    // Register navigation container with Sentry
    sentryRoutingInstrumentation.registerNavigationContainer({
      current: null,
    } as any);
  };

  if (isLoading) {
    return null; // Or return a splash screen component
  }

  return (
    <NavigationContainer
      linking={linking}
      onReady={onReady}
      onStateChange={(state) => {
        logger.navigation('State changed', state);
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="ChatDetail"
              component={ChatScreen}
              options={{
                headerShown: true,
                title: 'Chat',
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
