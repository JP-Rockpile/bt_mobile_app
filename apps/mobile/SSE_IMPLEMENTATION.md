# Server-Sent Events (SSE) Implementation Guide

## Overview

This document describes the comprehensive Server-Sent Events (SSE) implementation for the real-time chat feature. The implementation includes a custom React hook (`useChatSSE`) and a fully-featured chat component (`ChatSSEComponent`) with streaming message support and a blinking cursor effect.

## Architecture

### Components

1. **`useChatSSE` Hook** - Core SSE connection management
2. **`ChatSSEComponent`** - Complete chat UI with streaming support
3. **Type Definitions** - TypeScript types for SSE events

## Features

### ✅ Implemented Features

- **Event Types Support:**
  - `connected` - Connection established
  - `heartbeat` - Keep-alive events (every 30s)
  - `llm_chunk` - Streaming text chunks from AI
  - `llm_complete` - Complete AI response
  - `system` - System notifications (odds updates, bet status)
  - `error` - Error events

- **Connection Management:**
  - Automatic connection on mount
  - Manual connect/disconnect controls
  - Connection status tracking (disconnected, connecting, connected, reconnecting)
  - Exponential backoff reconnection strategy
  - Configurable max reconnection attempts

- **Message Handling:**
  - Real-time message accumulation
  - Streaming message buffer with chunk aggregation
  - Message history persistence
  - System message support with metadata

- **UI Features:**
  - Blinking cursor effect for streaming messages
  - Color-coded connection status indicator
  - Smooth scrolling to latest messages
  - Error display with reconnection option
  - Disabled input when disconnected

- **React Best Practices:**
  - Proper TypeScript typing throughout
  - Refs to avoid stale closures
  - useEffect cleanup to prevent memory leaks
  - Proper error handling and edge cases

## Usage

### Basic Hook Usage

```typescript
import { useChatSSE } from '@/hooks/useChatSSE';

function MyComponent() {
  const {
    status,           // Connection status
    error,            // Current error (if any)
    messages,         // Array of completed messages
    currentStreamingMessage,  // Currently streaming message
    connect,          // Manual connect function
    disconnect,       // Manual disconnect function
    clearMessages,    // Clear all messages
  } = useChatSSE({
    conversationId: 'conversation-123',
    accessToken: 'your-jwt-token',
    enabled: true,    // Auto-connect on mount
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    
    // Optional callbacks
    onConnect: () => console.log('Connected!'),
    onDisconnect: () => console.log('Disconnected!'),
    onMessage: (message) => console.log('New message:', message),
    onError: (error) => console.error('Error:', error),
  });

  return (
    <div>
      <p>Status: {status}</p>
      {currentStreamingMessage && (
        <p>Streaming: {currentStreamingMessage.content}</p>
      )}
    </div>
  );
}
```

### Using the Chat Component

```typescript
import { ChatSSEComponent } from '@/components/ChatSSEComponent';

function ChatPage({ conversationId }: { conversationId: string }) {
  const handleSendMessage = async (message: string) => {
    // Send the message to your API
    await fetch(`/api/chat/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: message }),
    });
  };

  return (
    <ChatSSEComponent
      conversationId={conversationId}
      onSendMessage={handleSendMessage}
    />
  );
}
```

## Backend Event Format

The hook expects SSE events in the following JSON format:

### Connected Event
```json
{
  "type": "connected",
  "timestamp": "2023-10-11T10:30:00.000Z"
}
```

### Heartbeat Event
```json
{
  "type": "heartbeat",
  "timestamp": "2023-10-11T10:30:30.000Z"
}
```

### LLM Chunk Event
```json
{
  "type": "llm_chunk",
  "content": "This is a streaming ",
  "timestamp": "2023-10-11T10:30:31.000Z"
}
```

### LLM Complete Event
```json
{
  "type": "llm_complete",
  "content": "This is a streaming chunk of text from the AI assistant.",
  "timestamp": "2023-10-11T10:30:35.000Z"
}
```

### System Event
```json
{
  "type": "system",
  "message": "Odds updated for your bet",
  "timestamp": "2023-10-11T10:31:00.000Z",
  "metadata": {
    "betId": "bet-123",
    "oldOdds": 2.5,
    "newOdds": 2.8
  }
}
```

### Error Event
```json
{
  "type": "error",
  "message": "Failed to process request",
  "error": "Rate limit exceeded",
  "timestamp": "2023-10-11T10:32:00.000Z"
}
```

## Backend Integration

### NestJS Endpoint Example

Your NestJS backend should expose the SSE endpoint at:

```
GET /api/v1/chat/conversations/:conversationId/stream
```

The hook supports JWT authentication via:
- **Query parameter**: `?access_token={token}` (implemented)
- **Bearer header**: `Authorization: Bearer {token}` (requires server support)

Example NestJS controller:

```typescript
@Controller('chat/conversations')
export class ChatConversationsController {
  @Get(':conversationId/stream')
  @UseGuards(JwtAuthGuard)
  async streamConversation(
    @Param('conversationId') conversationId: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    // Send connected event
    response.write(
      `data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      response.write(
        `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }, 30000);

    // Stream LLM chunks
    for await (const chunk of llmStream) {
      response.write(
        `data: ${JSON.stringify({
          type: 'llm_chunk',
          content: chunk,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }

    // Send completion event
    response.write(
      `data: ${JSON.stringify({
        type: 'llm_complete',
        content: fullContent,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Cleanup
    clearInterval(heartbeatInterval);
    response.end();
  }
}
```

## Configuration

### Environment Variables

Set the API URL in your environment configuration:

```typescript
// apps/mobile/src/config/index.ts
export const config: AppConfig = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  // ... other config
};
```

For React Native, use:
- Development: `http://localhost:3000`
- Staging: `https://staging-api.yourdomain.com`
- Production: `https://api.yourdomain.com`

### Hook Configuration Options

```typescript
interface UseChatSSEOptions {
  conversationId: string;          // Required: Conversation ID
  accessToken: string;              // Required: JWT access token
  enabled?: boolean;                // Optional: Auto-connect (default: true)
  maxReconnectAttempts?: number;    // Optional: Max reconnections (default: 5)
  reconnectDelay?: number;          // Optional: Base delay in ms (default: 2000)
  onConnect?: () => void;           // Optional: Connection callback
  onDisconnect?: () => void;        // Optional: Disconnection callback
  onMessage?: (message: ChatSSEMessage) => void;  // Optional: Message callback
  onError?: (error: string) => void;              // Optional: Error callback
}
```

## Troubleshooting

### Connection Issues

**Problem:** Connection fails immediately
- **Solution:** Check that the `apiUrl` in config is correct
- **Solution:** Verify the `accessToken` is valid and not expired
- **Solution:** Check backend logs for authentication errors

**Problem:** Connection drops frequently
- **Solution:** Verify heartbeat events are sent every 30s from backend
- **Solution:** Check for network connectivity issues
- **Solution:** Increase `maxReconnectAttempts` if needed

### Streaming Issues

**Problem:** Chunks not appearing in real-time
- **Solution:** Verify backend sends `llm_chunk` events with proper formatting
- **Solution:** Check that JSON parsing is succeeding (check logs)

**Problem:** Messages not moving to history
- **Solution:** Ensure backend sends `llm_complete` event after streaming
- **Solution:** Verify the `content` field in `llm_complete` event

### Authentication Issues

**Problem:** 401 Unauthorized errors
- **Solution:** Ensure `accessToken` is passed correctly
- **Solution:** For header auth, backend must support CORS preflight
- **Solution:** For query param auth (default), ensure backend reads the token

## Testing

### Manual Testing

1. **Test Connection:**
   - Open the chat screen
   - Verify status indicator shows "Connected" (green)

2. **Test Streaming:**
   - Send a message
   - Watch for chunks appearing with blinking cursor
   - Verify message moves to history when complete

3. **Test Reconnection:**
   - Disconnect from network
   - Verify status shows "Reconnecting" (orange)
   - Reconnect to network
   - Verify status returns to "Connected"

4. **Test Error Handling:**
   - Use invalid token
   - Verify error message appears
   - Verify reconnect option is available

### Automated Testing

Example test for the hook:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useChatSSE } from '@/hooks/useChatSSE';

describe('useChatSSE', () => {
  it('should connect successfully', async () => {
    const { result } = renderHook(() =>
      useChatSSE({
        conversationId: 'test-123',
        accessToken: 'valid-token',
      })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('connected');
    });
  });

  it('should accumulate streaming chunks', async () => {
    const { result } = renderHook(() =>
      useChatSSE({
        conversationId: 'test-123',
        accessToken: 'valid-token',
      })
    );

    // Mock receiving chunks...
    await waitFor(() => {
      expect(result.current.currentStreamingMessage?.content).toBe('Hello world');
    });
  });
});
```

## Performance Considerations

1. **Memory Management:**
   - Hook automatically cleans up on unmount
   - Abort controllers properly cancel requests
   - Timeouts are cleared on disconnect

2. **Network Efficiency:**
   - Exponential backoff prevents connection spam
   - Heartbeats keep connection alive without data transfer
   - Streaming reduces latency vs polling

3. **React Performance:**
   - Uses refs to avoid unnecessary re-renders
   - Memoizes message arrays
   - Efficient FlatList rendering for messages

## Migration from Legacy Implementation

If migrating from the existing `useSSEStream` hook:

1. Update event types in backend to new format
2. Replace `useSSEStream` import with `useChatSSE`
3. Update component to use new return values
4. Test thoroughly with real backend

The `ChatScreen` includes a toggle to switch between implementations for easy comparison.

## Future Enhancements

Potential improvements:

- [ ] Support for `@microsoft/fetch-event-source` library (better header support)
- [ ] Message persistence to local database
- [ ] Typing indicators based on events
- [ ] Read receipts
- [ ] Message reactions via SSE
- [ ] Voice message streaming
- [ ] File upload progress via SSE

## Support

For issues or questions:
1. Check the logs using the logger utility
2. Verify backend event format matches specification
3. Review connection status and error messages
4. Check network connectivity

## License

This implementation is part of the BetThink mobile application.

