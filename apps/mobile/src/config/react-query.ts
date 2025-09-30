import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import NetInfo from '@react-native-community/netinfo';

const queryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.statusCode >= 400 && error?.statusCode < 500 && error?.statusCode !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
      onError: (error: any) => {
        logger.error('Mutation error', error);
      },
    },
  },
};

export const queryClient = new QueryClient(queryConfig);

// Set up network status monitoring
let isOnline = true;

NetInfo.addEventListener((state) => {
  const wasOnline = isOnline;
  isOnline = state.isConnected ?? true;

  if (!wasOnline && isOnline) {
    logger.info('Network reconnected, resuming queries');
    queryClient.resumePausedMutations();
    queryClient.invalidateQueries();
  } else if (wasOnline && !isOnline) {
    logger.warn('Network disconnected');
  }
});

// Query keys factory for type-safe query keys
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
  },
  chat: {
    all: ['chat'] as const,
    threads: (params?: any) => ['chat', 'threads', params] as const,
    thread: (id: string) => ['chat', 'thread', id] as const,
    messages: (threadId: string, params?: any) => ['chat', 'messages', threadId, params] as const,
  },
  betting: {
    all: ['betting'] as const,
    recommendation: (id: string) => ['betting', 'recommendation', id] as const,
    history: (params?: any) => ['betting', 'history', params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (params?: any) => ['notifications', 'list', params] as const,
  },
} as const;
