import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Appearance, StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { BetConfirmationSheet } from './src/components/BetConfirmationSheet';
import { RootNavigator } from './src/navigation/RootNavigator';
import { lightTheme, darkTheme } from './src/theme';
import { queryClient } from './src/config/react-query';
import { useUIStore } from './src/stores/ui.store';
import { useAuthStore } from './src/stores/auth.store';
import { databaseService } from './src/services/database.service';
import { notificationService } from './src/services/notification.service';
import { analyticsService } from './src/services/analytics.service';
import { errorTrackingService } from './src/services/error-tracking.service';
import { logger } from './src/utils/logger';
import { config } from './src/config';

function AppContent() {
  const { effectiveTheme, updateEffectiveTheme } = useUIStore();
  const { initialize: initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeApp();

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      updateEffectiveTheme(colorScheme);
    });

    return () => {
      subscription.remove();
      cleanup();
    };
  }, [updateEffectiveTheme]);

  const initializeApp = async () => {
    try {
      logger.info('Initializing app', { environment: config.appEnv });

      // Initialize services in parallel
      await Promise.all([
        databaseService.initialize(),
        analyticsService.initialize(),
        notificationService.initialize(),
        initializeAuth(),
      ]);

      // Initialize error tracking (synchronous)
      errorTrackingService.initialize();

      // Check for OTA updates in production
      if (config.appEnv === 'production') {
        await checkForUpdates();
      }

      // Track app opened
      analyticsService.trackAppOpened();

      setIsReady(true);
      logger.info('App initialization completed');
    } catch (error) {
      logger.error('App initialization failed', error);
      errorTrackingService.captureException(
        error instanceof Error ? error : new Error(String(error)),
        { context: 'app_initialization' }
      );
      // Continue app launch even if initialization fails
      setIsReady(true);
    }
  };

  const checkForUpdates = async () => {
    try {
      if (!__DEV__ && Updates.isEnabled) {
        logger.info('Checking for OTA updates');
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          logger.info('OTA update available, fetching...');
          await Updates.fetchUpdateAsync();
          logger.info('OTA update fetched, reloading...');
          await Updates.reloadAsync();
        } else {
          logger.info('No OTA updates available');
        }
      }
    } catch (error) {
      logger.error('Failed to check for updates', error);
      // Don't block app launch if update check fails
    }
  };

  const cleanup = async () => {
    try {
      logger.info('Cleaning up app services');
      notificationService.cleanup();
      await databaseService.close();
    } catch (error) {
      logger.error('Cleanup failed', error);
    }
  };

  if (!isReady) {
    return null; // Or return a splash screen component
  }

  const theme = effectiveTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar
            barStyle={effectiveTheme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background}
          />
          <ErrorBoundary>
            <RootNavigator />
            <BetConfirmationSheet />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
