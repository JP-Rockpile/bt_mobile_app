import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  initialized = true;
  const dsn = (Constants.expoConfig?.extra as any)?.sentryDsn;
  if (!dsn) return;
  Sentry.init({
    dsn,
    enableInExpoDevelopment: true,
    debug: false,
    tracesSampleRate: 0.2,
  });
}

