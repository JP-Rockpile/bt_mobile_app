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
      const response = await fetch(this.options.url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.options.onConnectionChange?.(true);
      this.reconnectAttempts = 0;

      await this.processStream(response.body);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.debug('SSE connection aborted');
        return;
      }
      throw error;
    }
  }

  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          logger.info('SSE stream completed');
          if (!this.isManualClose) {
            this.handleStreamEnd();
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
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
      const chunk: StreamChunk = JSON.parse(event.data);
      this.options.onMessage(chunk);

      if (chunk.type === 'done') {
        logger.debug('Stream marked as done');
        this.close();
      }
    } catch (error) {
      logger.error('Failed to parse SSE event data', { eventText, error });
    }
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
    // Stream ended naturally, could be due to completion or server closing
    this.options.onConnectionChange?.(false);
    
    // Only attempt reconnect if we haven't reached max retries
    if (this.reconnectAttempts < this.maxRetries) {
      logger.info('SSE stream ended, attempting reconnect');
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
