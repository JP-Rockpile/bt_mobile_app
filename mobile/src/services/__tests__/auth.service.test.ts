import authService from '../auth.service';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

jest.mock('../auth.service', () => {
  const actual = jest.requireActual('../auth.service');
  return actual;
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user successfully', async () => {
      const mockDiscovery = {
        authorizationEndpoint: 'https://test.auth0.com/authorize',
        tokenEndpoint: 'https://test.auth0.com/token',
      };

      const mockAuthResult = {
        type: 'success',
        params: {
          code: 'test_auth_code',
        },
      };

      const mockTokenResponse = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        idToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfaWQiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwicGljdHVyZSI6Imh0dHBzOi8vZXhhbXBsZS5jb20vcGljdHVyZS5qcGciLCJleHAiOjk5OTk5OTk5OTl9.test',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      (AuthSession.fetchDiscoveryAsync as jest.Mock).mockResolvedValue(mockDiscovery);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test_code_verifier');
      
      // Mock the auth request
      const mockPromptAsync = jest.fn().mockResolvedValue(mockAuthResult);
      jest.spyOn(AuthSession, 'AuthRequest').mockImplementation(() => ({
        promptAsync: mockPromptAsync,
        redirectUri: 'betthink://auth',
      } as any));
      
      (AuthSession.exchangeCodeAsync as jest.Mock).mockResolvedValue(mockTokenResponse);

      const result = await authService.authenticate();

      expect(result.user).toEqual({
        id: 'test_user_id',
        email: 'test@test.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(result.tokens).toEqual({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        idToken: mockTokenResponse.idToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_access_token', 'test_access_token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_refresh_token', 'test_refresh_token');
    });

    it('should handle authentication cancellation', async () => {
      const mockDiscovery = {
        authorizationEndpoint: 'https://test.auth0.com/authorize',
        tokenEndpoint: 'https://test.auth0.com/token',
      };

      const mockAuthResult = {
        type: 'cancel',
      };

      (AuthSession.fetchDiscoveryAsync as jest.Mock).mockResolvedValue(mockDiscovery);
      
      const mockPromptAsync = jest.fn().mockResolvedValue(mockAuthResult);
      jest.spyOn(AuthSession, 'AuthRequest').mockImplementation(() => ({
        promptAsync: mockPromptAsync,
        redirectUri: 'betthink://auth',
      } as any));

      await expect(authService.authenticate()).rejects.toThrow('Authentication cancelled or failed');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockDiscovery = {
        tokenEndpoint: 'https://test.auth0.com/token',
      };

      const mockTokenResponse = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        idToken: 'new_id_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test_refresh_token');
      (AuthSession.fetchDiscoveryAsync as jest.Mock).mockResolvedValue(mockDiscovery);
      (AuthSession.refreshAsync as jest.Mock).mockResolvedValue(mockTokenResponse);

      const result = await authService.refreshAccessToken();

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        idToken: 'new_id_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_access_token', 'new_access_token');
    });

    it('should throw error when no refresh token is available', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('logout', () => {
    it('should clear stored tokens and open logout URL', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
      (WebBrowser.openBrowserAsync as jest.Mock).mockResolvedValue({ type: 'success' });

      await authService.logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_id_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_user');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_code_verifier');

      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
        expect.stringContaining('https://test.auth0.com/v2/logout')
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid tokens exist', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfaWQiLCJleHAiOjk5OTk5OTk5OTl9.test';
      
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_access_token') return Promise.resolve(validToken);
        return Promise.resolve(null);
      });

      const result = await authService.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no tokens exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });
  });
});