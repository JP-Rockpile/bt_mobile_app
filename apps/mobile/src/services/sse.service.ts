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

    logger.info('Establishing SSE connection', { url: this.options.url });

    try {
      logger.debug('SSE fetch starting...', { 
        url: this.options.url,
        hasToken: !!accessToken 
      });
      
      const response = await fetch(this.options.url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      logger.debug('SSE fetch completed', { 
        status: response.status,
        statusText: response.statusText,
        hasBody: !!response.body,
        headers: {
          contentType: response.headers.get('content-type'),
          cacheControl: response.headers.get('cache-control'),
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        logger.error('SSE connection failed with non-OK status', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200)
        });
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        logger.error('SSE response has no body', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error('Response body is null');
      }

      logger.debug('SSE connection established, starting to process stream');
      this.options.onConnectionChange?.(true);
      this.reconnectAttempts = 0;

      await this.processStream(response.body);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.debug('SSE connection aborted');
        return;
      }
      logger.error('SSE connection error in establishConnection', {
        error: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });
      throw error;
    }
  }

  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      logger.debug('SSE stream processing started');
      let chunkCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          logger.info('SSE stream completed', { totalChunks: chunkCount, bufferRemaining: buffer.length });
          if (!this.isManualClose) {
            this.handleStreamEnd();
          }
          break;
        }

        chunkCount++;
        const decodedChunk = decoder.decode(value, { stream: true });
        logger.debug('SSE chunk received', { 
          chunkNumber: chunkCount, 
          size: value.length,
          preview: decodedChunk.substring(0, 100)
        });

        buffer += decodedChunk;
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            logger.debug('SSE event text', { eventText: line });
            this.parseAndHandleEvent(line);
          }
        }
      }
    } catch (error) {
      if (!this.isManualClose) {
        logger.error('Error processing SSE stream', error);
        this.handleConnectionError(error as Error);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private parseAndHandleEvent(eventText: string): void {
    const event = this.parseSSEEvent(eventText);

    if (!event.data) return;

    try {
      let parsedEvent = JSON.parse(event.data);
      
      // Backend wraps SSE events in {data: {...}} - unwrap it
      if (parsedEvent.data && typeof parsedEvent.data === 'object') {
        logger.debug('Unwrapping backend data wrapper', { 
          wrapped: Object.keys(parsedEvent),
          unwrapped: Object.keys(parsedEvent.data)
        });
        parsedEvent = parsedEvent.data;
      }
      
      // Handle both ChatSSEEvent format (from backend reference) and StreamChunk format
      // Backend might send 'llm_complete' or 'done' to indicate completion
      const normalizedChunk = this.normalizeEventFormat(parsedEvent);
      
      this.options.onMessage(normalizedChunk);

      // Close connection when stream is complete
      if (normalizedChunk.type === 'done') {
        logger.debug('Stream marked as done, closing connection');
        this.close();
      }
    } catch (error) {
      logger.error('Failed to parse SSE event data', { eventText, error });
    }
  }
  
  private normalizeEventFormat(event: any): StreamChunk {
    // If backend sends 'llm_chunk' format, convert to 'content' format
    if (event.type === 'llm_chunk' && event.content) {
      return { type: 'content', content: event.content };
    }
    
    // If backend sends 'llm_complete', convert to 'done' format
    if (event.type === 'llm_complete') {
      return { type: 'done' };
    }
    
    // If backend sends 'connected' or 'heartbeat', ignore (don't forward to handler)
    if (event.type === 'connected' || event.type === 'heartbeat') {
      logger.debug(`SSE ${event.type} event received`);
      return { type: 'heartbeat' } as any; // Return a no-op event
    }
    
    // Pass through other events (error, done, content) as-is
    return event as StreamChunk;
  }

  private parseSSEEvent(eventText: string): SSEEvent {
    const lines = eventText.split('\n');
    const event: SSEEvent = { event: 'message', data: '' };

    for (const line of lines) {
      if (line.startsWith('event:')) {
        event.event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        event.data += line.slice(5).trim();
      } else if (line.startsWith('id:')) {
        event.id = line.slice(3).trim();
      } else if (line.startsWith('retry:')) {
        event.retry = parseInt(line.slice(6).trim(), 10);
      }
    }

    return event;
  }

  private handleConnectionError(error: Error): void {
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
    // Stream ended naturally (likely after LLM response completion)
    this.options.onConnectionChange?.(false);
    
    // Don't automatically reconnect - the stream ends after each message response
    // A new connection will be opened when the user sends the next message
    logger.info('SSE stream ended naturally (LLM response complete)');
    this.isManualClose = true; // Mark as manual to prevent reconnection attempts
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

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.options.onConnectionChange?.(false);
    logger.info('SSE connection closed');
  }

  isConnected(): boolean {
    return this.abortController !== null && !this.isManualClose;
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
