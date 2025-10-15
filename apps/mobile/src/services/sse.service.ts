import { logger } from '@/utils/logger';
import { authService } from './auth.service';
import type { StreamChunk, SSEEvent } from '@betthink/shared';

export interface SSEOptions {
  url: string;
  onMessage: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
  maxRetries?: number;
  retryDelay?: number;
}

class SSEConnection {
  private abortController: AbortController | null = null;
  private reconnectAttempts = 0;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private isManualClose = false;
  private reconnectTimeout?: NodeJS.Timeout;
  private connected = false; // Track actual connection state

  constructor(private options: SSEOptions) {
    this.maxRetries = options.maxRetries ?? 5;
    this.retryDelay = options.retryDelay ?? 1000;
  }

  async connect(): Promise<void> {
    if (this.abortController) {
      logger.warn('SSE connection already exists');
      return;
    }

    this.isManualClose = false;
    this.abortController = new AbortController();

    try {
      await this.establishConnection();
    } catch (error) {
      logger.error('Failed to establish SSE connection', error);
      this.handleConnectionError(error as Error);
    }
  }

  private async establishConnection(): Promise<void> {
    if (!this.abortController) return;

    const accessToken = await authService.getValidAccessToken();

    logger.info('Establishing SSE connection with XMLHttpRequest', { url: this.options.url });

    try {
      const xhr = new XMLHttpRequest();
      let buffer = '';

      xhr.open('GET', this.options.url);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      // Track XHR instance
      (this as any).xhr = xhr;

      xhr.onreadystatechange = () => {
        logger.debug('XHR state change', { 
          readyState: xhr.readyState, 
          status: xhr.status,
          responseLength: xhr.responseText?.length || 0
        });

        if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
          logger.info('✅ SSE headers received', { status: xhr.status });
          
          if (xhr.status === 200) {
            this.connected = true;
            this.options.onConnectionChange?.(true);
            this.reconnectAttempts = 0;
          } else {
            logger.error('SSE bad status', { status: xhr.status });
            this.handleConnectionError(new Error(`HTTP ${xhr.status}`));
          }
        }

        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          // Get new data since last check
          const newData = xhr.responseText.substring(buffer.length);
          
          if (newData) {
            logger.debug('📦 Received data', { size: newData.length });
            buffer = xhr.responseText;

            // Process complete SSE events (separated by \n\n)
            const events = buffer.split('\n\n');
            
            // Keep last incomplete event in buffer
            if (xhr.readyState !== XMLHttpRequest.DONE) {
              buffer = events.pop() || '';
            }

            for (const eventText of events) {
              if (eventText.trim()) {
                this.parseAndHandleEvent(eventText.trim());
              }
            }
          }
        }

        if (xhr.readyState === XMLHttpRequest.DONE) {
          logger.info('SSE connection closed by server');
          this.connected = false;
          this.options.onConnectionChange?.(false);
          
          if (!this.isManualClose && xhr.status === 200) {
            // Unexpected close, try to reconnect
            this.handleStreamEnd();
          } else if (xhr.status !== 200) {
            this.handleConnectionError(new Error(`Connection failed: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = (error) => {
        logger.error('XHR error', { error });
        this.handleConnectionError(new Error('XHR error'));
      };

      xhr.ontimeout = () => {
        logger.error('XHR timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      };

      // Listen for abort signal
      this.abortController.signal.addEventListener('abort', () => {
        logger.debug('Aborting XHR');
        xhr.abort();
      });

      xhr.send();
      logger.debug('XHR request sent');

    } catch (error: any) {
      logger.error('Failed to establish SSE connection', {
        error: error.message
      });
      this.handleConnectionError(error);
    }
  }

  private parseAndHandleEvent(eventText: string): void {
    try {
      // Extract data from SSE format
      const lines = eventText.split('\n');
      let dataLine = '';
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          dataLine += line.slice(5).trim();
        }
      }

      if (!dataLine) {
        logger.debug('No data in SSE event', { eventText: eventText.substring(0, 100) });
        return;
      }

      logger.debug('📨 SSE event data', { data: dataLine.substring(0, 150) });

      let parsedEvent = JSON.parse(dataLine);

      // Backend wraps in {data: {...}} - unwrap
      if (parsedEvent.data && typeof parsedEvent.data === 'object' && !parsedEvent.type) {
        logger.debug('Unwrapping data wrapper');
        parsedEvent = parsedEvent.data;
      }

      logger.debug('Event after unwrap', { type: parsedEvent.type });

      const normalizedChunk = this.normalizeEventFormat(parsedEvent);
      
      logger.debug('Normalized event', { type: normalizedChunk.type });

      this.options.onMessage(normalizedChunk);

      if (normalizedChunk.type === 'done') {
        logger.info('✅ LLM response complete');
      }
    } catch (error) {
      logger.error('Failed to parse SSE event', { 
        error: (error as Error).message,
        eventText: eventText.substring(0, 200)
      });
    }
  }

  // processStream and parseAndHandleEvent are no longer needed with EventSource
  // EventSource handles parsing automatically
  
  private normalizeEventFormat(event: any): StreamChunk {
    // If backend sends 'llm_chunk' format, convert to 'content' format
    if (event.type === 'llm_chunk' && event.content) {
      logger.debug('Converting llm_chunk to content', { contentLength: event.content.length });
      return { type: 'content', content: event.content };
    }
    
    // If backend sends 'llm_complete', convert to 'done' format
    // NOTE: Connection should remain open after this event
    if (event.type === 'llm_complete') {
      logger.debug('Converting llm_complete to done', { contentLength: event.content?.length });
      return { type: 'done', content: event.content };
    }
    
    // If backend sends 'connected' or 'heartbeat', pass through as heartbeat
    if (event.type === 'connected' || event.type === 'heartbeat') {
      logger.debug(`SSE ${event.type} event received`);
      return { type: 'heartbeat' } as any; // Return a no-op event
    }
    
    // If backend sends 'error', pass through
    if (event.type === 'error') {
      logger.error('SSE error event', { message: event.message });
      return { type: 'error', error: event.message || 'An error occurred' };
    }
    
    // Pass through other events (done, content) as-is
    return event as StreamChunk;
  }

  // parseSSEEvent no longer needed - EventSource handles this

  private handleConnectionError(error: Error): void {
    this.connected = false; // Mark as disconnected
    this.options.onConnectionChange?.(false);
    this.options.onError?.(error);

    if (this.reconnectAttempts < this.maxRetries && !this.isManualClose) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.maxRetries) {
      logger.error('Max SSE reconnection attempts reached');
      this.options.onMessage({
        type: 'error',
        error: 'Connection lost. Please try again.',
      });
    }
  }

  private handleStreamEnd(): void {
    // Stream ended naturally (server closed connection unexpectedly)
    // In normal operation, SSE should stay open even after llm_complete events
    this.connected = false; // Mark as disconnected
    this.options.onConnectionChange?.(false);
    
    logger.warn('SSE stream ended unexpectedly, will attempt to reconnect');
    
    // Attempt to reconnect since this shouldn't happen in normal operation
    if (!this.isManualClose && this.reconnectAttempts < this.maxRetries) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.retryDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    logger.info(`Scheduling SSE reconnection attempt ${this.reconnectAttempts}/${this.maxRetries}`, {
      delay,
    });

    this.reconnectTimeout = setTimeout(() => {
      this.abortController = null;
      this.connect();
    }, delay);
  }

  close(): void {
    this.isManualClose = true;
    this.connected = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    // Abort XHR if exists
    const xhr = (this as any).xhr;
    if (xhr) {
      xhr.abort();
      (this as any).xhr = null;
      logger.debug('XHR aborted');
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.options.onConnectionChange?.(false);
    logger.info('SSE connection closed');
  }

  isConnected(): boolean {
    return this.connected && this.abortController !== null && !this.isManualClose;
  }
}

class SSEService {
  private connections: Map<string, SSEConnection> = new Map();

  createConnection(id: string, options: SSEOptions): SSEConnection {
    // Close existing connection with same ID
    this.closeConnection(id);

    const connection = new SSEConnection(options);
    this.connections.set(id, connection);

    logger.debug(`Created SSE connection: ${id}`);
    return connection;
  }

  getConnection(id: string): SSEConnection | undefined {
    return this.connections.get(id);
  }

  closeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.close();
      this.connections.delete(id);
      logger.debug(`Closed SSE connection: ${id}`);
    }
  }

  closeAllConnections(): void {
    logger.info('Closing all SSE connections');
    this.connections.forEach((connection) => connection.close());
    this.connections.clear();
  }

  getActiveConnectionCount(): number {
    return Array.from(this.connections.values()).filter((conn) => conn.isConnected()).length;
  }
}

export const sseService = new SSEService();
