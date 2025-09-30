import React, { PropsWithChildren, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { useApiBase } from '../api/client';
import { router } from 'expo-router';

async function registerPushToken(sendToken?: (token: string, deviceId: string, platform: 'ios' | 'android') => Promise<void>) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }
  const token = await Notifications.getExpoPushTokenAsync({ projectId: (Constants.expoConfig?.extra as any)?.eas?.projectId }).then((t) => t.data);
  const deviceId = Platform.OS === 'ios' ? await Application.getIosIdForVendorAsync() : Application.getAndroidId();
  if (sendToken) await sendToken(token, deviceId || 'unknown', Platform.OS as 'ios' | 'android');
  return token;
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { request } = useApiBase();
  useEffect(() => {
    const sendToken = async (token: string, deviceId: string, platform: 'ios' | 'android') => {
      try {
        await request('/v1/device/push-token', {
          method: 'POST',
          body: JSON.stringify({ token, deviceId, platform }),
        });
      } catch {}
    };
    registerPushToken(sendToken).catch(() => {});
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const threadId = response.notification.request.content.data?.threadId as string | undefined;
      if (threadId) router.push(`/chat/${threadId}`);
    });
    return () => sub.remove();
  }, []);
  return <>{children}</>;
}

