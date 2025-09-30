// Date utilities
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

// Odds conversion utilities
export const convertOdds = (
  odds: number,
  from: 'decimal' | 'american' | 'fractional',
  to: 'decimal' | 'american' | 'fractional'
): number => {
  if (from === to) return odds;

  // Convert to decimal first
  let decimal: number;
  if (from === 'decimal') {
    decimal = odds;
  } else if (from === 'american') {
    decimal = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  } else {
    // fractional (e.g., 5/2 = 2.5 in decimal = 3.5 including stake)
    decimal = odds + 1;
  }

  // Convert from decimal to target
  if (to === 'decimal') {
    return Math.round(decimal * 100) / 100;
  } else if (to === 'american') {
    return decimal >= 2
      ? Math.round((decimal - 1) * 100)
      : Math.round(-100 / (decimal - 1));
  } else {
    return Math.round((decimal - 1) * 100) / 100;
  }
};

export const calculatePayout = (stake: number, odds: number, oddsFormat: string): number => {
  const decimalOdds =
    oddsFormat === 'decimal' ? odds : convertOdds(odds, oddsFormat as any, 'decimal');
  return Math.round(stake * decimalOdds * 100) / 100;
};

// String utilities
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Retry utilities
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const exponentialBackoff = (attemptNumber: number, baseDelayMs = 1000): number => {
  return Math.min(baseDelayMs * Math.pow(2, attemptNumber), 30000);
};

// Deep linking utilities
export const buildDeepLink = (
  scheme: string,
  path: string,
  params?: Record<string, string>
): string => {
  const queryString = params
    ? '?' +
      Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  return `${scheme}://${path}${queryString}`;
};

// Error utilities
export const sanitizeError = (error: unknown): { message: string; code?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: 'An unknown error occurred' };
};

// Platform utilities
export const isIOS = (): boolean => {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);
};
