import { useState, useCallback, useEffect } from 'react';
import { locationService, UserLocation, LocationPermissionStatus } from '@/services/location.service';
import { logger } from '@/utils/logger';

interface UseLocationReturn {
  location: UserLocation | null;
  permissionStatus: LocationPermissionStatus | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  clearError: () => void;
  isLocationEnabled: boolean;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await locationService.checkPermission();
        setPermissionStatus(status);

        const enabled = await locationService.isLocationEnabled();
        setIsLocationEnabled(enabled);
      } catch (err) {
        logger.error('Failed to check location status', err);
      }
    };

    checkStatus();
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const status = await locationService.requestPermission();
      setPermissionStatus(status);

      if (status.granted) {
        // Automatically get location after permission granted
        await getCurrentLocation();
      } else if (!status.canAskAgain) {
        setError('Location permission denied. Please enable it in device settings.');
      } else {
        setError('Location permission is required to show available sportsbooks in your area.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request location permission';
      setError(message);
      logger.error('Location permission request failed', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userLocation = await locationService.getCurrentLocation();
      setLocation(userLocation);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      logger.error('Failed to get current location', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    location,
    permissionStatus,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
    clearError,
    isLocationEnabled,
  };
}

