import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { jwtDecode } from 'jwt-decode';
import config from '@config/index';
import { AuthTokens, User } from '@types/index';
import { logger } from '@utils/logger';

WebBrowser.maybeCompleteAuthSession();

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  ID_TOKEN: 'auth_id_token',
  USER: 'auth_user',
  CODE_VERIFIER: 'auth_code_verifier'
};

class AuthService {
  private discovery: AuthSession.DiscoveryDocument | null = null;
  private codeVerifier: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.discovery = await AuthSession.fetchDiscoveryAsync(
        `https://${config.auth0.domain}`
      );
      logger.info('Auth discovery initialized');
    } catch (error) {
      logger.error('Failed to initialize auth discovery', error);
    }
  }

  private async getDiscovery(): Promise<AuthSession.DiscoveryDocument> {
    if (!this.discovery) {
      this.discovery = await AuthSession.fetchDiscoveryAsync(
        `https://${config.auth0.domain}`
      );
    }
    return this.discovery;
  }

  async createAuthRequest(): Promise<AuthSession.AuthRequest> {
    const discovery = await this.getDiscovery();
    
    // Generate PKCE challenge
    this.codeVerifier = AuthSession.AuthRequest.PKCE.codeChallenge();
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.CODE_VERIFIER, this.codeVerifier);

    const request = new AuthSession.AuthRequest({
      clientId: config.auth0.clientId,
      scopes: config.auth0.scope.split(' '),
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'betthink',
        path: 'auth'
      }),
      responseType: AuthSession.ResponseType.Code,
      codeChallenge: await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      ),
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      extraParams: {
        audience: config.auth0.audience,
        prompt: 'login'
      },
      usePKCE: true
    });

    return request;
  }

  async authenticate(): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const request = await this.createAuthRequest();
      const discovery = await this.getDiscovery();
      
      const result = await request.promptAsync(discovery, {
        useProxy: false,
        showInRecents: true
      });

      if (result.type !== 'success' || !result.params.code) {
        throw new Error('Authentication cancelled or failed');
      }

      const codeVerifier = await SecureStore.getItemAsync(SECURE_STORE_KEYS.CODE_VERIFIER);
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      // Exchange code for tokens
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: config.auth0.clientId,
          code: result.params.code,
          redirectUri: request.redirectUri,
          codeVerifier,
          extraParams: {
            audience: config.auth0.audience
          }
        },
        discovery
      );

      const tokens: AuthTokens = {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        idToken: tokenResponse.idToken,
        expiresIn: tokenResponse.expiresIn || 3600,
        tokenType: tokenResponse.tokenType || 'Bearer'
      };

      // Decode ID token to get user info
      const decodedIdToken = jwtDecode<any>(tokenResponse.idToken || '');
      const user: User = {
        id: decodedIdToken.sub,
        email: decodedIdToken.email,
        name: decodedIdToken.name || decodedIdToken.email,
        picture: decodedIdToken.picture,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store tokens securely
      await this.storeTokens(tokens);
      await this.storeUser(user);

      logger.info('User authenticated successfully');
      return { user, tokens };
    } catch (error) {
      logger.error('Authentication failed', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const discovery = await this.getDiscovery();
      const tokenResponse = await AuthSession.refreshAsync(
        {
          clientId: config.auth0.clientId,
          refreshToken,
          extraParams: {
            audience: config.auth0.audience
          }
        },
        discovery
      );

      const tokens: AuthTokens = {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken || refreshToken,
        idToken: tokenResponse.idToken,
        expiresIn: tokenResponse.expiresIn || 3600,
        tokenType: tokenResponse.tokenType || 'Bearer'
      };

      await this.storeTokens(tokens);
      logger.info('Access token refreshed successfully');
      return tokens;
    } catch (error) {
      logger.error('Failed to refresh access token', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear stored tokens and user data
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ID_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.CODE_VERIFIER);

      // Open logout URL in browser
      const logoutUrl = `https://${config.auth0.domain}/v2/logout?client_id=${config.auth0.clientId}&returnTo=${encodeURIComponent('betthink://logout')}`;
      await WebBrowser.openBrowserAsync(logoutUrl);

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error);
      throw error;
    }
  }

  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const accessToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      const idToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ID_TOKEN);

      if (!accessToken) {
        return null;
      }

      // Check if token is expired
      try {
        const decoded = jwtDecode<any>(accessToken);
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
          // Token expired, try to refresh
          if (refreshToken) {
            return await this.refreshAccessToken();
          }
          return null;
        }
      } catch {
        // Invalid token
        return null;
      }

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        idToken: idToken || undefined,
        expiresIn: 3600,
        tokenType: 'Bearer'
      };
    } catch (error) {
      logger.error('Failed to get stored tokens', error);
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER);
      if (!userJson) {
        return null;
      }
      return JSON.parse(userJson);
    } catch (error) {
      logger.error('Failed to get stored user', error);
      return null;
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    if (tokens.refreshToken) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
    if (tokens.idToken) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.ID_TOKEN, tokens.idToken);
    }
  }

  private async storeUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER, JSON.stringify(user));
  }

  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    return tokens !== null;
  }
}

export default new AuthService();