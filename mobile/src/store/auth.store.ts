import { create } from 'zustand';
import { AuthState, User, AuthTokens } from '@types/index';
import authService from '@services/auth.service';
import { logger } from '@utils/logger';

interface AuthStore extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tokens: null,
  error: null,

  login: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await authService.authenticate();
      set({
        isAuthenticated: true,
        isLoading: false,
        user,
        tokens,
        error: null
      });
      logger.info('User logged in', { userId: user.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: errorMessage
      });
      logger.error('Login failed', error);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: null
      });
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout failed', error);
      // Force logout even if API call fails
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: null
      });
    }
  },

  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const [tokens, user] = await Promise.all([
        authService.getStoredTokens(),
        authService.getStoredUser()
      ]);

      if (tokens && user) {
        set({
          isAuthenticated: true,
          isLoading: false,
          user,
          tokens,
          error: null
        });
        logger.info('Auth status checked - authenticated', { userId: user.id });
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          tokens: null,
          error: null
        });
        logger.info('Auth status checked - not authenticated');
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: 'Failed to check authentication status'
      });
      logger.error('Auth status check failed', error);
    }
  },

  setUser: (user) => set({ user }),
  setTokens: (tokens) => set({ tokens }),
  setError: (error) => set({ error })
}));