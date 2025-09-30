import Constants from 'expo-constants';
import { useAuth } from '../features/auth/AuthProvider';

export function useApiBase() {
  const { ensureFreshToken } = useAuth();
  const apiUrl: string = (Constants.expoConfig?.extra as any)?.apiUrl;

  async function request(path: string, init?: RequestInit) {
    const token = await ensureFreshToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    };
    const res = await fetch(`${apiUrl}${path}`, { ...init, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${text}`);
    }
    return res;
  }

  return { request };
}

