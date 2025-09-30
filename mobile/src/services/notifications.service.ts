import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './api.client';
import { logger } from '@utils/logger';
import config from '@config/index';

class NotificationService {
  private notificationListener: any = null;
  private responseListener: any = null;

  async initialize() {
    if (!config.features.enablePushNotifications) {
      logger.info('Push notifications disabled');
      return;
    }

    try {
      // Request permissions
      const { status } = await this.requestPermissions();
      if (status !== 'granted') {
        logger.warn('Push notification permission not granted');
        return;
      }

      // Get push token
      const token = await this.getExpoPushToken();
      if (token) {
        await this.registerDeviceToken(token);
      }

      // Set up listeners
      this.setupListeners();
      
      logger.info('Notifications initialized');
    } catch (error) {
      logger.error('Failed to initialize notifications', error);
    }
  }

  private async requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return await Notifications.requestPermissionsAsync();
  }

  private async getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      logger.warn('Push notifications require a physical device');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        logger.error('Project ID not found in app config');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      logger.info('Expo push token obtained', { token: token.data });
      return token.data;
    } catch (error) {
      logger.error('Failed to get push token', error);
      return null;
    }
  }

  private async registerDeviceToken(token: string) {
    try {
      const response = await apiClient.post('/notifications/register', {
        token,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          modelName: Device.modelName,
          osVersion: Device.osVersion,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      logger.info('Device token registered');
    } catch (error) {
      logger.error('Failed to register device token', error);
    }
  }

  private setupListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      logger.info('Notification received in foreground', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
      
      this.handleNotification(notification);
    });

    // Handle notification responses (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      logger.info('Notification response received', {
        actionIdentifier: response.actionIdentifier,
        data: response.notification.request.content.data,
      });
      
      this.handleNotificationResponse(response);
    });
  }

  private handleNotification(notification: Notifications.Notification) {
    const { data } = notification.request.content;
    
    // Handle different notification types
    if (data?.type === 'chat_message') {
      // Update chat store with new message
      // This would be handled by the chat service
    } else if (data?.type === 'bet_update') {
      // Handle bet status update
    } else if (data?.type === 'promotion') {
      // Handle promotional notifications
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification data
    if (data?.chatId) {
      // Navigate to specific chat
      // This would use the navigation service
    } else if (data?.betId) {
      // Navigate to bet details
    }
  }

  async scheduleLocalNotification(title: string, body: string, data?: any, trigger?: Notifications.NotificationTriggerInput) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: trigger || { seconds: 1 },
      });
      
      logger.info('Local notification scheduled', { id, title });
      return id;
    } catch (error) {
      logger.error('Failed to schedule notification', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info('Notification cancelled', { notificationId });
    } catch (error) {
      logger.error('Failed to cancel notification', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info('All notifications cancelled');
    } catch (error) {
      logger.error('Failed to cancel all notifications', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

const notificationService = new NotificationService();

export const initializeNotifications = () => notificationService.initialize();
export default notificationService;