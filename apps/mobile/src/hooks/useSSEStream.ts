import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '@/api/endpoints';
import { sseService } from '@/services/sse.service';
import { useChatStore } from '@/stores/chat.store';
import { analyticsService } from '@/services/analytics.service';
import { errorTrackingService } from '@/services/error-tracking.service';
import { logger } from '@/utils/logger';
import type { StreamChunk } from '@shared/types';

interface UseSSEStreamOptions {
  threadId: string;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export const useSSEStream = ({
  threadId,
  onComplete,
  onError,
  enabled = true,
}: UseSSEStreamOptions) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startStream, appendStreamChunk, endStream, setStreamError } = useChatStore();
  const connectionIdRef = useRef<string>(`stream-${threadId}`);
  const startTimeRef = useRef<number>(0);

  const handleMessage = useCallback(
    (chunk: StreamChunk) => {
      if (chunk.type === 'content' && chunk.content) {
        setStreamedContent((prev) => prev + chunk.content);
        appendStreamChunk(threadId, chunk);
      } else if (chunk.type === 'error') {
        const errorMsg = chunk.error || 'An error occurred during streaming';
        setError(errorMsg);
        setIsStreaming(false);
        setStreamError(threadId, errorMsg);
        onError?.(errorMsg);
        
        errorTrackingService.captureSSEError(threadId, new Error(errorMsg));
        logger.error('SSE stream error', { threadId, error: errorMsg });
      } else if (chunk.type === 'done') {
        const responseTime = Date.now() - startTimeRef.current;
        analyticsService.trackChatMessageReceived(threadId, responseTime);
        
        setIsStreaming(false);
        endStream(threadId);
        onComplete?.(streamedContent);
        
        logger.info('SSE stream completed', { threadId, responseTime });
      }
    },
    [threadId, streamedContent, appendStreamChunk, endStream, setStreamError, onComplete, onError]
  );

  const handleError = useCallback(
    (err: Error) => {
      const errorMsg = err.message || 'Connection error';
      setError(errorMsg);
      setIsStreaming(false);
      setStreamError(threadId, errorMsg);
      onError?.(errorMsg);

      analyticsService.trackSSEConnection('failed');
      errorTrackingService.captureSSEError(threadId, err);
      logger.error('SSE connection error', { threadId, error: err });
    },
    [threadId, setStreamError, onError]
  );

  const handleConnectionChange = useCallback(
    (connected: boolean) => {
      setIsConnected(connected);

      if (connected) {
        analyticsService.trackSSEConnection('established');
        logger.info('SSE connection established', { threadId });
      } else if (isStreaming) {
        analyticsService.trackSSEConnection('reconnection_attempted');
        logger.info('SSE connection lost, will retry', { threadId });
      }
    },
    [threadId, isStreaming]
  );

  const startStreaming = useCallback(() => {
    if (!enabled) return;

    setIsStreaming(true);
    setStreamedContent('');
    setError(null);
    startTimeRef.current = Date.now();

    startStream(threadId);

    const streamUrl = chatApi.getStreamUrl(threadId);
    const connection = sseService.createConnection(connectionIdRef.current, {
      url: streamUrl,
      onMessage: handleMessage,
      onError: handleError,
      onConnectionChange: handleConnectionChange,
      maxRetries: 5,
      retryDelay: 1000,
    });

    connection.connect();

    logger.info('SSE streaming started', { threadId, url: streamUrl });
  }, [
    enabled,
    threadId,
    startStream,
    handleMessage,
    handleError,
    handleConnectionChange,
  ]);

  const stopStreaming = useCallback(() => {
    sseService.closeConnection(connectionIdRef.current);
    setIsStreaming(false);
    endStream(threadId);
    logger.info('SSE streaming stopped', { threadId });
  }, [threadId, endStream]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    isStreaming,
    streamedContent,
    isConnected,
    error,
    startStreaming,
    stopStreaming,
  };
};
