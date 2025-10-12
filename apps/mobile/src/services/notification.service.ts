import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { notificationApi } from '@/api/endpoints';
import type { DeviceToken } from '@betthink/shared';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing notification service');

      // Only request permissions and register on physical devices
      if (!Device.isDevice) {
        logger.warn('Push notifications not available on simulator/emulator');
        return;
      }

      await this.requestPermissions();
      await this.registerForPushNotifications();
      this.setupListeners();

      logger.info('Notification service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize notification service', error);
    }
  }

  private async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Push notification permissions not granted');
      return false;
    }

    logger.info('Push notification permissions granted');
    return true;
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      // Skip push notification registration if no project ID is configured
      if (!projectId) {
        logger.warn('EAS Project ID not configured. Push notifications are disabled. To enable, set EAS_PROJECT_ID in your environment or run "eas init".');
        return;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      logger.info('Expo push token obtained');

      // Register device with backend
      await this.registerDeviceWithBackend(token.data);

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }
    } catch (error) {
      logger.error('Failed to register for push notifications', error);
      throw error;
    }
  }

  private async registerDeviceWithBackend(token: string): Promise<void> {
    try {
      const deviceData: Omit<DeviceToken, 'createdAt'> = {
        userId: '', // Will be set by backend based on auth token
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Constants.deviceId || '',
      };

      await notificationApi.registerDevice(deviceData);
      logger.info('Device registered with backend for push notifications');
    } catch (error) {
      logger.error('Failed to register device with backend', error);
      // Don't throw - notification registration shouldn't block app usage
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });

    await Notifications.setNotificationChannelAsync('bet_results', {
      name: 'Bet Results',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });

    await Notifications.setNotificationChannelAsync('chat_messages', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#2196F3',
    });

    logger.info('Android notification channels configured');
  }

  private setupListeners(): void {
    // Handler for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      logger.info('Notification received in foreground', notification);
      this.handleForegroundNotification(notification);
    });

    // Handler for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.info('Notification tapped', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleForegroundNotification(notification: Notifications.Notification): void {
    // Custom handling for foreground notifications
    const { data } = notification.request.content;
    logger.debug('Foreground notification data', data);

    // You can customize behavior based on notification type
    // For example, show an in-app toast or update UI
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;

    // Deep link based on notification type
    if (data?.type === 'chat_message' && data?.chatId) {
      this.navigateToChat(data.chatId as string);
    } else if (data?.type === 'bet_result' && data?.betId) {
      this.navigateToBet(data.betId as string);
    }
  }

  private navigateToChat(chatId: string): void {
    // This will be handled by the navigation service
    logger.info('Navigate to chat', { chatId });
    // navigationService.navigate('Chat', { threadId: chatId });
  }

  private navigateToBet(betId: string): void {
    logger.info('Navigate to bet', { betId });
    // navigationService.navigate('BetHistory', { betId });
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null, // null = show immediately
      });

      logger.info('Local notification scheduled', { notificationId });
      return notificationId;
    } catch (error) {
      logger.error('Failed to schedule local notification', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    logger.info('Notification cancelled', { notificationId });
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    logger.info('All notifications cancelled');
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  async unregister(): Promise<void> {
    try {
      if (this.expoPushToken && Constants.deviceId) {
        await notificationApi.unregisterDevice(Constants.deviceId);
        logger.info('Device unregistered from push notifications');
      }

      this.cleanup();
    } catch (error) {
      logger.error('Failed to unregister device', error);
    }
  }

  cleanup(): void {
    this.notificationListener?.remove();
    this.responseListener?.remove();
    this.expoPushToken = null;
    logger.info('Notification service cleaned up');
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
