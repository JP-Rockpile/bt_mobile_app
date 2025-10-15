import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Required for web browser to close properly after auth
WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_accessToken',
  REFRESH_TOKEN: 'auth_refreshToken',
  EXPIRES_AT: 'auth_expiresAt',
  ID_TOKEN: 'auth_idToken',
  USER: 'auth_user',
} as const;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  idToken?: string;
}

export interface User {
  id: string;
  email: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
  dateOfBirth?: string;
  firstName?: string;
  lastName?: string;
}

interface Auth0Credentials {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

export interface SignupData {
  email: string;
  password: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  private tokenRefreshTimeout?: NodeJS.Timeout;
  private discoveryDocument: AuthSession.DiscoveryDocument | null = null;

  /**
   * Gets the discovery document (cached after first call)
   */
  private async getDiscovery(): Promise<AuthSession.DiscoveryDocument> {
    if (!this.discoveryDocument) {
      this.discoveryDocument = await AuthSession.fetchDiscoveryAsync(
        `https://${config.auth0Domain}`
      );
    }
    return this.discoveryDocument;
  }

  /**
   * Creates an auth request for Auth0
   */
  private createAuthRequest() {
    // For Expo Go, use native redirect (no custom scheme needed)
    // For production builds, use custom scheme
    const redirectUri = AuthSession.makeRedirectUri({
      native: 'betthink://auth/callback',
    });

    logger.info('Auth redirect URI:', redirectUri);
    console.log('🔐 Auth redirect URI:', redirectUri); // Also log to console for visibility

    return new AuthSession.AuthRequest({
      clientId: config.auth0ClientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      extraParams: {
        audience: config.auth0Audience,
      },
      usePKCE: true,
    });
  }

  /**
   * Initiates Auth0 Universal Login with PKCE (for social logins)
   */
  async login(): Promise<User> {
    try {
      logger.info('Initiating Auth0 login with PKCE');

      const discovery = await this.getDiscovery();
      const authRequest = this.createAuthRequest();

      const result = await authRequest.promptAsync(discovery);

      if (result.type !== 'success') {
        throw new Error(`Authentication failed: ${result.type}`);
      }

      if (!authRequest.codeVerifier) {
        throw new Error('No code verifier available');
      }

      // Exchange code for tokens
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: config.auth0ClientId,
          code: result.params.code,
          redirectUri: authRequest.redirectUri,
          extraParams: {
            code_verifier: authRequest.codeVerifier,
          },
        },
        discovery
      );

      const credentials: Auth0Credentials = {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        idToken: tokenResult.idToken,
        expiresIn: tokenResult.expiresIn,
      };

      await this.storeCredentials(credentials);
      const user = await this.getUserInfo(credentials.accessToken);
      await this.storeUser(user);

      this.scheduleTokenRefresh(credentials.expiresIn || 3600);

      logger.info('Login successful', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Login failed', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Sign up with email and password using Auth0 Database Connection
   */
  async signupWithPassword(data: SignupData): Promise<{ success: boolean; email: string }> {
    try {
      logger.info('Signing up with email/password');

      const response = await fetch(`https://${config.auth0Domain}/dbconnections/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.auth0ClientId,
          email: data.email,
          password: data.password,
          connection: 'Username-Password-Authentication',
          user_metadata: {
            date_of_birth: data.dateOfBirth,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.description || responseData.message || 'Signup failed';
        logger.error('Signup failed', { error: responseData });
        throw new Error(errorMessage);
      }

      logger.info('Signup successful', { email: data.email });
      return { success: true, email: data.email };
    } catch (error) {
      logger.error('Signup failed', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Signup failed. Please try again.');
    }
  }

  /**
   * Login with email and password using Auth0 Resource Owner Password Grant
   */
  async loginWithPassword(credentials: LoginCredentials): Promise<User> {
    try {
      logger.info('Logging in with email/password');

      const requestBody = {
        grant_type: 'password',
        username: credentials.email,
        password: credentials.password,
        client_id: config.auth0ClientId,
        audience: config.auth0Audience,
        scope: 'openid profile email offline_access',
        realm: 'Username-Password-Authentication',
      };

      logger.debug('Login request body:', { ...requestBody, password: '[REDACTED]' });

      const response = await fetch(`https://${config.auth0Domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error_description || responseData.error || 'Login failed';
        logger.error('Password login failed', { 
          error: responseData,
          status: response.status,
          realm: 'Username-Password-Authentication'
        });
        
        // Provide more user-friendly error messages
        if (errorMessage.includes('Wrong email or password')) {
          throw new Error('Invalid email or password');
        } else if (errorMessage.includes('blocked')) {
          throw new Error('Account temporarily blocked. Please try again later.');
        } else if (errorMessage.includes('verify')) {
          throw new Error('Please verify your email before logging in');
        }
        throw new Error(errorMessage);
      }

      const auth0Credentials: Auth0Credentials = {
        accessToken: responseData.access_token,
        refreshToken: responseData.refresh_token,
        idToken: responseData.id_token,
        expiresIn: responseData.expires_in,
      };

      await this.storeCredentials(auth0Credentials);
      const user = await this.getUserInfo(auth0Credentials.accessToken);
      await this.storeUser(user);

      this.scheduleTokenRefresh(auth0Credentials.expiresIn || 3600);

      logger.info('Password login successful', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Password login failed', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      logger.info('Requesting password reset', { email });

      const response = await fetch(`https://${config.auth0Domain}/dbconnections/change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.auth0ClientId,
          email: email,
          connection: 'Username-Password-Authentication',
        }),
      });

      // Auth0 returns 200 with a string response on success
      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Password reset request failed', { error: errorData });
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Password reset request failed', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send reset email. Please try again.');
    }
  }

  /**
   * Logs out the user and clears stored credentials
   * For client-side logout (stateless API), we only need to clear local credentials
   */
  async logout(): Promise<void> {
    try {
      logger.info('Logging out user');

      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
      }

      // Clear local stored credentials
      await this.clearStoredCredentials();

      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout failed', error);
      throw error;
    }
  }

  /**
   * Retrieves stored authentication tokens
   */
  async getTokens(): Promise<AuthTokens | null> {
    try {
      const [accessToken, refreshToken, expiresAt, idToken] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.EXPIRES_AT),
        SecureStore.getItemAsync(STORAGE_KEYS.ID_TOKEN),
      ]);

      if (!accessToken || !refreshToken || !expiresAt) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt, 10),
        idToken: idToken || undefined,
      };
    } catch (error) {
      logger.error('Failed to retrieve tokens', error);
      return null;
    }
  }

  /**
   * Retrieves the stored user
   */
  async getUser(): Promise<User | null> {
    try {
      const userJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      logger.error('Failed to retrieve user', error);
      return null;
    }
  }

  /**
   * Checks if the access token is expired or expiring soon (within 5 minutes)
   */
  async isTokenExpired(): Promise<boolean> {
    const tokens = await this.getTokens();
    if (!tokens) return true;

    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    return now >= tokens.expiresAt - bufferMs;
  }

  /**
   * Refreshes the access token using the refresh token
   */
  async refreshToken(): Promise<AuthTokens> {
    try {
      const tokens = await this.getTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      logger.debug('Refreshing access token');

      const discovery = await this.getDiscovery();
      const tokenResult = await AuthSession.refreshAsync(
        {
          clientId: config.auth0ClientId,
          refreshToken: tokens.refreshToken,
        },
        discovery
      );

      const credentials: Auth0Credentials = {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken || tokens.refreshToken,
        idToken: tokenResult.idToken,
        expiresIn: tokenResult.expiresIn,
      };

      await this.storeCredentials(credentials);
      this.scheduleTokenRefresh(credentials.expiresIn || 3600);

      logger.info('Token refresh successful');

      return {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken || tokens.refreshToken,
        expiresAt: Date.now() + (credentials.expiresIn || 3600) * 1000,
        idToken: credentials.idToken,
      };
    } catch (error) {
      logger.error('Token refresh failed', error);
      // If refresh fails, clear credentials and require re-login
      await this.clearStoredCredentials();
      throw new Error('Token refresh failed. Please log in again.');
    }
  }

  /**
   * Gets a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string> {
    const expired = await this.isTokenExpired();

    if (expired) {
      const tokens = await this.refreshToken();
      return tokens.accessToken;
    }

    const tokens = await this.getTokens();
    if (!tokens) {
      throw new Error('No authentication tokens available');
    }

    return tokens.accessToken;
  }

  /**
   * Fetches user info from Auth0
   */
  private async getUserInfo(accessToken: string): Promise<User> {
    try {
      const response = await fetch(`https://${config.auth0Domain}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();

      return {
        id: userInfo.sub,
        email: userInfo.email || '',
        picture: userInfo.picture,
        dateOfBirth: userInfo.user_metadata?.date_of_birth,
        firstName: userInfo.user_metadata?.first_name || userInfo.given_name,
        lastName: userInfo.user_metadata?.last_name || userInfo.family_name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to fetch user info', error);
      throw error;
    }
  }

  /**
   * Stores credentials securely
   */
  private async storeCredentials(credentials: Auth0Credentials): Promise<void> {
    const expiresAt = Date.now() + (credentials.expiresIn || 3600) * 1000;

    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, credentials.accessToken),
      credentials.refreshToken
        ? SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, credentials.refreshToken)
        : Promise.resolve(),
      SecureStore.setItemAsync(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString()),
      credentials.idToken
        ? SecureStore.setItemAsync(STORAGE_KEYS.ID_TOKEN, credentials.idToken)
        : Promise.resolve(),
    ]);
  }

  /**
   * Stores user data securely
   */
  private async storeUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Clears all stored credentials
   */
  private async clearStoredCredentials(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.EXPIRES_AT),
      SecureStore.deleteItemAsync(STORAGE_KEYS.ID_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
    ]);
  }

  /**
   * Schedules automatic token refresh before expiration
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    // Refresh 5 minutes before expiration
    const refreshIn = Math.max((expiresIn - 300) * 1000, 60000); // Minimum 1 minute

    this.tokenRefreshTimeout = setTimeout(() => {
      this.refreshToken().catch((error) => {
        logger.error('Scheduled token refresh failed', error);
      });
    }, refreshIn);

    logger.debug(`Token refresh scheduled in ${refreshIn / 1000} seconds`);
  }
}

export const authService = new AuthService();
