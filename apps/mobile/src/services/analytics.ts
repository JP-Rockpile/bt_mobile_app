import { init, track, setUserId, setUserProperties } from '@amplitude/analytics-react-native';
import Constants from 'expo-constants';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  initialized = true;
  const apiKey = (Constants.expoConfig?.extra as any)?.amplitudeApiKey;
  if (!apiKey) return;
  init(apiKey, undefined, { flushIntervalMillis: 5000 });
}

export const analytics = {
  track: (eventName: string, props?: Record<string, any>) => track(eventName, props),
  setUserId: (userId: string) => setUserId(userId),
  setUserProperties: (props: Record<string, any>) => setUserProperties(props),
};

