import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number; // epoch seconds
};

type AuthContextType = {
  isAuthenticated: boolean;
  accessToken?: string;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  ensureFreshToken: () => Promise<string | undefined>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'betthink_auth_tokens_v1';

const buildAuth0Config = () => {
  const extra = (Constants.expoConfig?.extra || {}) as any;
  const rawDomain = extra.auth0Domain as unknown;
  const domain = typeof rawDomain === 'string' ? rawDomain : Array.isArray(rawDomain) ? rawDomain[0] : undefined;
  const issuer = domain ? `https://${domain}` : undefined;
  const clientId = typeof extra.auth0ClientId === 'string' ? extra.auth0ClientId : undefined;
  const rawAudience = extra.auth0Audience as unknown;
  const audience: string | undefined = typeof rawAudience === 'string' ? rawAudience : Array.isArray(rawAudience) ? rawAudience[0] : undefined;
  const rawScheme = (Constants.expoConfig as any)?.scheme as unknown;
  const scheme = typeof rawScheme === 'string' ? rawScheme : Array.isArray(rawScheme) ? rawScheme[0] : 'betthink';
  const redirectUri = AuthSession.makeRedirectUri({ scheme });
  return { issuer, clientId, audience, redirectUri } as const;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<TokenBundle | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as TokenBundle;
          setTokens(parsed);
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (tb?: TokenBundle) => {
    setTokens(tb);
    if (tb) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(tb));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  const login = useCallback(async () => {
    const { issuer, clientId, audience, redirectUri } = buildAuth0Config();
    if (!issuer || !clientId) return;
    const discovery = await AuthSession.fetchDiscoveryAsync(issuer);

    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      usePKCE: true,
      scopes: ['openid', 'profile', 'offline_access'],
      extraParams: audience ? { audience } : undefined,
    });
    await request.makeAuthUrlAsync(discovery);
    const result = await request.promptAsync(discovery);
    if (result.type !== 'success' || !result.params.code) return;
    const tokenRes = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code: result.params.code,
        extraParams: {
          ...(audience ? { audience } : {}),
          code_verifier: request.codeVerifier!,
        },
        redirectUri,
      },
      discovery,
    );
    const expiresAt = Math.floor(Date.now() / 1000) + (tokenRes.expiresIn ?? 3600) - 30;
    await save({
      accessToken: tokenRes.accessToken!,
      refreshToken: tokenRes.refreshToken,
      idToken: tokenRes.idToken,
      expiresAt,
    });
  }, [save]);

  const refresh = useCallback(async (current: TokenBundle) => {
    const { issuer, clientId } = buildAuth0Config();
    if (!issuer || !clientId || !current.refreshToken) return undefined;
    const discovery = await AuthSession.fetchDiscoveryAsync(issuer);
    const res = await AuthSession.refreshAsync(
      {
        clientId,
        refreshToken: current.refreshToken,
        scopes: ['openid', 'profile', 'offline_access'],
      },
      discovery,
    );
    const expiresAt = Math.floor(Date.now() / 1000) + (res.expiresIn ?? 3600) - 30;
    const next = {
      accessToken: res.accessToken!,
      refreshToken: res.refreshToken ?? current.refreshToken,
      idToken: res.idToken ?? current.idToken,
      expiresAt,
    } satisfies TokenBundle;
    await save(next);
    return next.accessToken;
  }, [save]);

  const ensureFreshToken = useCallback(async () => {
    if (!tokens) return undefined;
    const now = Math.floor(Date.now() / 1000);
    if (tokens.expiresAt - now < 30) {
      return await refresh(tokens);
    }
    return tokens.accessToken;
  }, [tokens, refresh]);

  const logout = useCallback(async () => {
    await save(undefined);
  }, [save]);

  const value: AuthContextType = useMemo(
    () => ({
      isAuthenticated: Boolean(tokens?.accessToken),
      accessToken: tokens?.accessToken,
      loading,
      login,
      logout,
      ensureFreshToken,
    }),
    [tokens, loading, login, logout, ensureFreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

