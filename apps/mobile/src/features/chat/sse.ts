import Constants from 'expo-constants';
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

export type SSETextCallback = (text: string) => void;
export type SSEEventCallback = (data: any) => void;

export type SSEOptions = {
  maxRetries?: number;
  retryDelayMs?: number;
  onReconnect?: (attempt: number) => void;
  onError?: (e: unknown) => void;
  onDone?: () => void;
};

export async function fetchSSE(
  path: string,
  body: any,
  onText: SSETextCallback,
  init?: RequestInit,
) {
  const urlBase: string = (Constants.expoConfig?.extra as any)?.apiUrl;
  const res = await fetch(`${urlBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    signal: init?.signal,
  });
  if (!res.ok || !res.body) throw new Error(`SSE failed: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const parser = createParser((event) => {
    if (event.type === 'event') {
      const e = event as ParsedEvent;
      if (e.data === '[DONE]') return;
      onText(e.data);
    }
  });
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    parser.feed(chunk);
  }
}

export async function streamWithRetry(
  path: string,
  payload: any,
  onText: SSETextCallback,
  init?: RequestInit,
  options?: SSEOptions,
) {
  const { maxRetries = 3, retryDelayMs = 1000, onReconnect, onError, onDone } = options || {};
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await fetchSSE(path, payload, onText, init);
      onDone?.();
      return;
    } catch (e) {
      onError?.(e);
      if (attempt === maxRetries) break;
      await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
      onReconnect?.(attempt + 1);
      attempt += 1;
    }
  }
  onDone?.();
}

