import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const prefix = Linking.createURL('/');

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Debug logging - also check raw store state
  const storeState = useAuthStore.getState();
  logger.info('RootNavigator render', { 
    isAuthenticated, 
    isLoading,
    storeStateAuth: storeState.isAuthenticated,
    storeStateLoading: storeState.isLoading,
    hasUser: !!storeState.user,
    hasTokens: !!storeState.tokens,
  });

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

  // Force navigation to Main when authenticated
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return null; // Or return a splash screen component
  }

  return (
    <NavigationContainer
      key={`nav-${isAuthenticated ? 'authd' : 'unauthd'}`}
      ref={navigationRef}
      linking={linking}
      onReady={onReady}
      onStateChange={(state) => {
        logger.navigation('State changed', state);
      }}
    >
      <Stack.Navigator
        key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
        initialRouteName={isAuthenticated ? 'Main' : 'Auth'}
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
