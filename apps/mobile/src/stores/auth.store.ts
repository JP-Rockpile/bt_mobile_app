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
        // Check if token is expired
        const isExpired = await authService.isTokenExpired();
        if (isExpired) {
          logger.info('Token expired, refreshing...');
          await get().refreshTokens();
        } else {
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
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

      set({
        tokens,
        isAuthenticated: true,
      });

      logger.info('Tokens refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', error);
      // Clear auth state on refresh failure
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        error: 'Session expired. Please log in again.',
      });
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
