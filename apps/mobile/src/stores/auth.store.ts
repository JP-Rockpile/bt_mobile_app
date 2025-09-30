import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import { logger } from '@/utils/logger';
import type { User, AuthTokens } from '@shared/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
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

  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      await authService.logout();

      set({
        user: null,
        tokens: null,
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
}));
