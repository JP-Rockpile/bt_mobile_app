import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useChatThreads, useSendMessage } from '@/hooks/useChat';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useChat hooks', () => {
  it('should fetch chat threads', async () => {
    const { result } = renderHook(() => useChatThreads('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add assertions based on mocked API responses
  });

  it('should send a message', async () => {
    const { result } = renderHook(() => useSendMessage('thread-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.mutate).toBeDefined();
    });

    // Test message sending
    // result.current.mutate('Test message');
  });
});
