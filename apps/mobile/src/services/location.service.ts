import * as Location from 'expo-location';
import { logger } from '@/utils/logger';

export interface UserLocation {
  latitude: number;
  longitude: number;
  state?: string;
  country?: string;
  city?: string;
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

class LocationService {
  private currentLocation: UserLocation | null = null;

  /**
   * Check current location permission status
   */
  async checkPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
    } catch (error) {
      logger.error('Failed to check location permission', error);
      throw error;
    }
  }

  /**
   * Request location permission from the user
   */
  async requestPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      logger.info('Location permission requested', { status, canAskAgain });
      
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
    } catch (error) {
      logger.error('Failed to request location permission', error);
      throw error;
    }
  }

  /**
   * Get current location with reverse geocoding to determine state
   */
  async getCurrentLocation(): Promise<UserLocation> {
    try {
      const permissionStatus = await this.checkPermission();
      
      if (!permissionStatus.granted) {
        throw new Error('Location permission not granted');
      }

      // Get current position with low accuracy (better for privacy and battery)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      // Reverse geocode to get state information
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        state: geocode?.region || geocode?.isoCountryCode, // region is state/province
        country: geocode?.country,
        city: geocode?.city,
        timestamp: Date.now(),
      };

      this.currentLocation = userLocation;
      logger.info('Location retrieved successfully', {
        state: userLocation.state,
        country: userLocation.country,
      });

      return userLocation;
    } catch (error) {
      logger.error('Failed to get current location', error);
      throw error;
    }
  }

  /**
   * Get last known location (cached)
   */
  getLastKnownLocation(): UserLocation | null {
    return this.currentLocation;
  }

  /**
   * Clear cached location
   */
  clearLocation(): void {
    this.currentLocation = null;
  }

  /**
   * Open device settings for location permissions
   */
  async openSettings(): Promise<void> {
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch (error) {
      logger.error('Failed to open location settings', error);
    }
  }

  /**
   * Check if location services are enabled on the device
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      logger.error('Failed to check if location is enabled', error);
      return false;
    }
  }
}

export const locationService = new LocationService();

