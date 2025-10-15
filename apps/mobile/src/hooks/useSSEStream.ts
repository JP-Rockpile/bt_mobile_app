import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '@/api/endpoints';
import { sseService } from '@/services/sse.service';
import { useChatStore } from '@/stores/chat.store';
import { analyticsService } from '@/services/analytics.service';
import { errorTrackingService } from '@/services/error-tracking.service';
import { logger } from '@/utils/logger';
import type { StreamChunk } from '@betthink/shared';

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
  // Disable hook if threadId is empty
  const isEnabled = enabled && !!threadId;
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startStream, appendStreamChunk, endStream, setStreamError } = useChatStore();
  // Use threadId directly instead of ref since it can change
  const connectionId = `stream-${threadId}`;
  const startTimeRef = useRef<number>(0);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        
        // Clear timeout on error
        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
          streamingTimeoutRef.current = null;
        }
        
        errorTrackingService.captureSSEError(threadId, new Error(errorMsg));
        logger.error('SSE stream error', { threadId, error: errorMsg });
        
        // Close connection on error
        sseService.closeConnection(connectionIdRef.current);
      } else if (chunk.type === 'done') {
        const responseTime = Date.now() - startTimeRef.current;
        analyticsService.trackChatMessageReceived(threadId, responseTime);
        
        // Get the full content (either from chunk or accumulated buffer)
        const fullContent = chunk.content || streamedContent;
        
        setIsStreaming(false);
        endStream(threadId);
        onComplete?.(fullContent);
        
        // Clear timeout on successful completion
        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
          streamingTimeoutRef.current = null;
        }
        
        logger.info('SSE stream completed', { threadId, responseTime });
        
        // NOTE: Connection remains open for next message
        // Do NOT close the connection here
      } else if ((chunk as any).type === 'heartbeat') {
        // Heartbeat events are handled by the service layer for connection keep-alive
        // No action needed here
        logger.debug('SSE heartbeat received', { threadId });
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

  const connectSSE = useCallback(async () => {
    if (!isEnabled) {
      logger.warn('connectSSE called but disabled', { threadId, enabled, hasThreadId: !!threadId });
      return;
    }

    if (!threadId) {
      logger.error('connectSSE called with empty threadId - this should not happen');
      return;
    }

    const currentConnectionId = `stream-${threadId}`;
    
    // Check if connection already exists
    const existingConnection = sseService.getConnection(currentConnectionId);
    
    // Only create new connection if one doesn't exist or is not connected
    if (!existingConnection || !existingConnection.isConnected()) {
      logger.info('Creating new SSE connection', { 
        threadId, 
        connectionId: currentConnectionId,
        existingConnection: !!existingConnection,
        isConnected: existingConnection?.isConnected() 
      });
      
      const streamUrl = chatApi.getStreamUrl(threadId);
      logger.debug('SSE stream URL', { streamUrl: streamUrl.replace(/access_token=[^&]+/, 'access_token=REDACTED') });
      
      const connection = sseService.createConnection(currentConnectionId, {
        url: streamUrl,
        onMessage: (chunk) => {
          logger.debug('SSE message received in useSSEStream', { type: chunk.type, hasContent: !!chunk.content });
          handleMessage(chunk);
        },
        onError: handleError,
        onConnectionChange: handleConnectionChange,
        maxRetries: 5, // Allow retries for reconnection
        retryDelay: 1000,
      });

      await connection.connect();
      
      logger.info('SSE connection initiated', { threadId, connectionId: currentConnectionId });
      
      // Small delay to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logger.info('SSE connection setup complete', { threadId });
    } else {
      logger.debug('SSE connection already exists', { threadId, connectionId: currentConnectionId, isConnected: existingConnection.isConnected() });
    }
  }, [
    isEnabled,
    threadId,
    handleMessage,
    handleError,
    handleConnectionChange,
  ]);

  const startStreaming = useCallback(() => {
    // Clear any existing timeout
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }

    // Reset streaming state for new message
    setIsStreaming(true);
    setStreamedContent('');
    setError(null);
    startTimeRef.current = Date.now();
    startStream(threadId);

    // Set timeout to reset streaming state if no response in 30 seconds
    streamingTimeoutRef.current = setTimeout(() => {
      logger.error('Streaming timeout - no response received', { threadId });
      setIsStreaming(false);
      setError('Response timeout. Please try again.');
      endStream(threadId);
      onError?.('Response timeout');
    }, 30000);

    logger.info('SSE streaming started', { threadId });
  }, [threadId, startStream, endStream, onError]);

  const stopStreaming = useCallback(() => {
    const currentConnectionId = `stream-${threadId}`;
    sseService.closeConnection(currentConnectionId);
    setIsStreaming(false);
    endStream(threadId);
    logger.info('SSE streaming stopped', { threadId, connectionId: currentConnectionId });
  }, [threadId, endStream]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    isStreaming,
    streamedContent,
    isConnected, // ✅ Already in return
    error,
    connectSSE,
    startStreaming,
    stopStreaming,
  };
};
