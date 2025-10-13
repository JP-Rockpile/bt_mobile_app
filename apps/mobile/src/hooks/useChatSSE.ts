import { useState, useEffect, useCallback, useRef } from 'react';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import type { ChatSSEEvent, LLMChunkEvent, LLMCompleteEvent, SystemEvent } from '@betthink/shared';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface ChatSSEMessage {
  id: string;
  content: string;
  timestamp: string;
  type: 'assistant' | 'system';
  metadata?: Record<string, unknown>;
  isStreaming?: boolean;
}

export interface UseChatSSEOptions {
  conversationId: string;
  accessToken: string;
  enabled?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: ChatSSEMessage) => void;
  onError?: (error: string) => void;
}

export interface UseChatSSEReturn {
  status: ConnectionStatus;
  error: string | null;
  messages: ChatSSEMessage[];
  currentStreamingMessage: ChatSSEMessage | null;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

/**
 * Custom React hook for managing Server-Sent Events (SSE) connection for real-time chat
 * 
 * @param options - Configuration options for the SSE connection
 * @returns Object containing connection status, messages, and control functions
 */
export const useChatSSE = ({
  conversationId,
  accessToken,
  enabled = true,
  maxReconnectAttempts = 5,
  reconnectDelay = 2000,
  onConnect,
  onDisconnect,
  onMessage,
  onError,
}: UseChatSSEOptions): UseChatSSEReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatSSEMessage[]>([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<ChatSSEMessage | null>(null);

  // Use refs to avoid stale closures
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStreamBufferRef = useRef<string>('');
  const isManualDisconnectRef = useRef(false);
  
  // Refs for callbacks to get latest values in event handlers
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onConnect, onDisconnect, onMessage, onError]);

  /**
   * Handles incoming SSE events
   */
  const handleSSEEvent = useCallback((event: ChatSSEEvent) => {
    logger.debug('Received SSE event', { type: event.type, timestamp: event.timestamp });

    switch (event.type) {
      case 'connected':
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnectRef.current?.();
        logger.info('SSE connection established', { conversationId });
        break;

      case 'heartbeat':
        // Keep connection alive, no action needed
        logger.debug('Heartbeat received');
        break;

      case 'llm_chunk': {
        const chunkEvent = event as LLMChunkEvent;
        currentStreamBufferRef.current += chunkEvent.content;
        
        const streamingMsg: ChatSSEMessage = {
          id: `streaming-${conversationId}-${Date.now()}`,
          content: currentStreamBufferRef.current,
          timestamp: chunkEvent.timestamp,
          type: 'assistant',
          isStreaming: true,
        };
        
        setCurrentStreamingMessage(streamingMsg);
        break;
      }

      case 'llm_complete': {
        const completeEvent = event as LLMCompleteEvent;
        const finalMessage: ChatSSEMessage = {
          id: `msg-${conversationId}-${Date.now()}`,
          content: completeEvent.content,
          timestamp: completeEvent.timestamp,
          type: 'assistant',
          isStreaming: false,
        };

        // Move streaming message to message history
        setMessages(prev => [...prev, finalMessage]);
        setCurrentStreamingMessage(null);
        currentStreamBufferRef.current = '';
        
        onMessageRef.current?.(finalMessage);
        logger.info('LLM response completed', { conversationId, contentLength: completeEvent.content.length });
        break;
      }

      case 'system': {
        const systemEvent = event as SystemEvent;
        const systemMessage: ChatSSEMessage = {
          id: `system-${conversationId}-${Date.now()}`,
          content: systemEvent.message,
          timestamp: systemEvent.timestamp,
          type: 'system',
          metadata: systemEvent.metadata,
        };

        setMessages(prev => [...prev, systemMessage]);
        onMessageRef.current?.(systemMessage);
        logger.info('System message received', { conversationId, message: systemEvent.message });
        break;
      }

      case 'error': {
        const errorMsg = event.message || 'An error occurred during streaming';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        logger.error('SSE error event received', { conversationId, error: errorMsg });
        break;
      }

      default:
        logger.warn('Unknown SSE event type', { type: (event as any).type });
    }
  }, [conversationId]);

  /**
   * Parses SSE event text and extracts JSON data
   */
  const parseSSEEvent = useCallback((eventText: string): ChatSSEEvent | null => {
    try {
      // SSE format: "data: {...}\n\n"
      const lines = eventText.trim().split('\n');
      let dataLine = '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          dataLine += line.slice(5).trim();
        }
      }

      if (!dataLine) {
        return null;
      }

      const eventData = JSON.parse(dataLine) as ChatSSEEvent;
      
      // Validate event structure
      if (!eventData.type || !eventData.timestamp) {
        logger.warn('Invalid SSE event structure', { eventData });
        return null;
      }

      return eventData;
    } catch (err) {
      logger.error('Failed to parse SSE event', { eventText, error: err });
      return null;
    }
  }, []);

  /**
   * Process the readable stream from the fetch response
   */
  const processStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          logger.info('SSE stream ended');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // SSE events are separated by double newlines
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const eventText of events) {
          if (eventText.trim()) {
            const event = parseSSEEvent(eventText);
            if (event) {
              handleSSEEvent(event);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        throw err;
      }
    } finally {
      reader.releaseLock();
    }
  }, [parseSSEEvent, handleSSEEvent]);

  /**
   * Establishes the SSE connection
   */
  const establishConnection = useCallback(async () => {
    if (abortControllerRef.current) {
      logger.warn('Connection already exists');
      return;
    }

    isManualDisconnectRef.current = false;
    abortControllerRef.current = new AbortController();
    
    setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');
    setError(null);

    try {
      // Construct the SSE URL with the access token
      // Using query parameter approach since native EventSource doesn't support headers
      const baseUrl = config.apiUrl;
      const streamUrl = `${baseUrl}/api/v1/chat/conversations/${conversationId}/stream?access_token=${encodeURIComponent(accessToken)}`;

      logger.info('Establishing SSE connection', { 
        conversationId, 
        url: streamUrl.replace(accessToken, '[REDACTED]') 
      });

      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      await processStream(response);

      // Stream ended naturally
      if (!isManualDisconnectRef.current) {
        handleStreamEnd();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logger.debug('SSE connection aborted');
        return;
      }

      logger.error('SSE connection error', { conversationId, error: err });
      handleConnectionError(err);
    }
  }, [conversationId, accessToken, processStream]);

  /**
   * Handles errors during connection
   */
  const handleConnectionError = useCallback((err: Error) => {
    const errorMessage = err.message || 'Connection failed';
    setError(errorMessage);
    setStatus('disconnected');
    onErrorRef.current?.(errorMessage);

    if (!isManualDisconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
      scheduleReconnect();
    } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', { conversationId });
      setError('Connection lost. Maximum reconnection attempts reached.');
    }
  }, [conversationId, maxReconnectAttempts]);

  /**
   * Handles stream ending naturally
   */
  const handleStreamEnd = useCallback(() => {
    setStatus('disconnected');
    onDisconnectRef.current?.();

    // Don't automatically reconnect after stream completion
    // The stream ends after each LLM response (after 'llm_complete')
    // A new connection should be explicitly opened when needed
    logger.info('Stream ended naturally (LLM response complete)', { conversationId });
    isManualDisconnectRef.current = true; // Mark as manual to prevent reconnection
  }, [conversationId]);

  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current++;

    logger.info(`Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`, {
      conversationId,
      delay,
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      abortControllerRef.current = null;
      establishConnection();
    }, delay);
  }, [conversationId, reconnectDelay, maxReconnectAttempts, establishConnection]);

  /**
   * Connects to the SSE stream
   */
  const connect = useCallback(() => {
    if (!accessToken) {
      setError('Access token is required');
      logger.error('Cannot connect: No access token provided');
      return;
    }

    disconnect(); // Disconnect any existing connection
    reconnectAttemptsRef.current = 0;
    establishConnection();
  }, [accessToken, establishConnection]);

  /**
   * Disconnects from the SSE stream
   */
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setStatus('disconnected');
    setCurrentStreamingMessage(null);
    currentStreamBufferRef.current = '';
    onDisconnectRef.current?.();
    
    logger.info('SSE connection closed', { conversationId });
  }, [conversationId]);

  /**
   * Clears all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentStreamingMessage(null);
    currentStreamBufferRef.current = '';
    logger.debug('Messages cleared', { conversationId });
  }, [conversationId]);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, conversationId, accessToken]);

  return {
    status,
    error,
    messages,
    currentStreamingMessage,
    connect,
    disconnect,
    clearMessages,
  };
};

