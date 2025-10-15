import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import { logger } from '@/utils/logger';
import type { User, AuthTokens, SignupData, LoginCredentials } from '@/services/auth.service';
import type { UserLocation } from '@/services/location.service';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  location: UserLocation | null;
  locationPermissionAsked: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: () => Promise<void>;
  loginWithPassword: (credentials: LoginCredentials) => Promise<void>;
  signupWithPassword: (data: SignupData) => Promise<{ success: boolean; email: string }>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLocation: (location: UserLocation | null) => void;
  setLocationPermissionAsked: (asked: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  location: null,
  locationPermissionAsked: false,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      const [user, tokens] = await Promise.all([
        authService.getUser(),
        authService.getTokens(),
      ]);

      if (user && tokens) {
        logger.info('Found stored user and tokens', {
          userId: user.id,
          email: user.email,
          tokenExpiresAt: new Date(tokens.expiresAt).toISOString(),
        });

        // Check if token is expired
        const isExpired = await authService.isTokenExpired();
        if (isExpired) {
          logger.info('Token expired, attempting refresh...');
          try {
            await get().refreshTokens();
          } catch (refreshError) {
            logger.error('Token refresh failed during initialization', refreshError);
            // If refresh fails, still set the user state but mark as unauthenticated
            // This way the user sees they need to log in again, but we keep their user data
            set({
              user,
              tokens: null,
              isLoading: false,
              isAuthenticated: false,
              error: 'Your session has expired. Please log in again.',
            });
            return;
          }
        } else {
          logger.info('Token is still valid, user authenticated');
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        logger.info('No stored credentials found, user needs to log in');
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      logger.error('Auth initialization failed', error);
      set({
        isLoading: false,
        isAuthenticated: false,
        error: 'Failed to initialize authentication',
      });
    }
  },

  login: async () => {
    try {
      set({ isLoading: true, error: null });

      const user = await authService.login();
      const tokens = await authService.getTokens();

      set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });

      logger.info('User logged in successfully');
    } catch (error) {
      logger.error('Login failed', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  loginWithPassword: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const user = await authService.loginWithPassword(credentials);
      const tokens = await authService.getTokens();

      set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });

      logger.info('User logged in with password successfully');
    } catch (error) {
      logger.error('Password login failed', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  signupWithPassword: async (data: SignupData) => {
    try {
      set({ isLoading: true, error: null });

      const result = await authService.signupWithPassword(data);

      set({ isLoading: false });
      logger.info('User signed up successfully');

      return result;
    } catch (error) {
      logger.error('Signup failed', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      });
      throw error;
    }
  },

  requestPasswordReset: async (email: string) => {
    try {
      set({ isLoading: true, error: null });

      await authService.requestPasswordReset(email);

      set({ isLoading: false });
      logger.info('Password reset requested successfully');
    } catch (error) {
      logger.error('Password reset request failed', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      await authService.logout();

      set({
        user: null,
        tokens: null,
        location: null,
        locationPermissionAsked: false,
        isAuthenticated: false,
        isLoading: false,
      });

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      });
    }
  },

  refreshTokens: async () => {
    try {
      const tokens = await authService.refreshToken();

      // Also update the user object to ensure it's fresh
      const user = get().user;

      set({
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      logger.info('Tokens refreshed successfully', {
        userId: user?.id,
        newExpiresAt: new Date(tokens.expiresAt).toISOString(),
      });
    } catch (error) {
      logger.error('Token refresh failed in store', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Only clear auth state if it's a definitive failure
      // (e.g., refresh token expired, not a network error)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const shouldClearAuth = 
        errorMessage.includes('refresh token') || 
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('No refresh token available');

      if (shouldClearAuth) {
        logger.warn('Clearing auth state due to refresh token failure');
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: 'Your session has expired. Please log in again.',
        });
      } else {
        logger.warn('Token refresh failed but keeping auth state for retry');
        // Keep the user state but mark as not loading
        set({
          isLoading: false,
          error: 'Failed to refresh session. Please try again.',
        });
      }
      
      throw error;
    }
  },

  setUser: (user) => {
    set({ user });
  },

  setError: (error) => {
    set({ error });
  },

  setLocation: (location) => {
    set({ location });
    if (location) {
      logger.info('User location set', { state: location.state, country: location.country });
    }
  },

  setLocationPermissionAsked: (asked) => {
    set({ locationPermissionAsked: asked });
  },
}));
