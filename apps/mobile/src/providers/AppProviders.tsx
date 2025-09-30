import React, { PropsWithChildren, useMemo } from 'react';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAnalytics } from '../services/analytics';
import { initSentry } from '../services/sentry';
import * as Sentry from 'sentry-expo';
import { AuthProvider } from '../features/auth/AuthProvider';
import { NotificationsProvider } from './NotificationsProvider';

// Initialize connectivity listeners for React Query
onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))));

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 15_000,
      },
    },
  }), []);

  initSentry();
  initAnalytics();

  return (
    <Sentry.Native.TouchEventBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationsProvider>
              <PaperProvider theme={theme}>{children}</PaperProvider>
            </NotificationsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </Sentry.Native.TouchEventBoundary>
  );
}

