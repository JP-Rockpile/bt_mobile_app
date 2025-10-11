# Quick Start Guide - SSE Chat Implementation

## 🚀 5-Minute Setup

### Step 1: Import and Use the Hook

```typescript
import { useChatSSE } from '@/hooks/useChatSSE';
import { useAuthStore } from '@/stores/auth.store';

function MyChatComponent({ conversationId }: { conversationId: string }) {
  const { accessToken } = useAuthStore();
  
  const { status, messages, currentStreamingMessage } = useChatSSE({
    conversationId,
    accessToken: accessToken || '',
  });
  
  return (
    <div>
      <p>Status: {status}</p>
      {messages.map(msg => (
        <p key={msg.id}>{msg.content}</p>
      ))}
      {currentStreamingMessage && (
        <p>{currentStreamingMessage.content}▊</p>
      )}
    </div>
  );
}
```

### Step 2: Or Use the Complete Component

```typescript
import { ChatSSEComponent } from '@/components/ChatSSEComponent';

function ChatPage({ conversationId }: { conversationId: string }) {
  const handleSend = async (message: string) => {
    await chatApi.sendMessage(conversationId, message);
  };

  return (
    <ChatSSEComponent
      conversationId={conversationId}
      onSendMessage={handleSend}
    />
  );
}
```

### Step 3: Configure Your Backend Endpoint

Your backend must expose:
```
GET /api/v1/chat/conversations/:conversationId/stream?access_token={token}
```

## ✅ Checklist

- [ ] Backend endpoint is accessible
- [ ] Backend sends proper SSE event format (see below)
- [ ] JWT authentication is configured
- [ ] CORS is configured if needed
- [ ] Environment variable `apiUrl` is set

## 📋 Required Backend Event Format

```typescript
// Connection established
data: {"type":"connected","timestamp":"2023-10-11T10:30:00.000Z"}

// Keep-alive (every 30s)
data: {"type":"heartbeat","timestamp":"2023-10-11T10:30:30.000Z"}

// Streaming chunk
data: {"type":"llm_chunk","content":"Hello ","timestamp":"2023-10-11T10:30:31.000Z"}

// Completion
data: {"type":"llm_complete","content":"Hello world","timestamp":"2023-10-11T10:30:35.000Z"}

// System message
data: {"type":"system","message":"Odds updated","timestamp":"2023-10-11T10:31:00.000Z"}
```

## 🎨 Features Included

✅ Automatic connection management  
✅ Blinking cursor for streaming text  
✅ Connection status indicator (green/red/orange)  
✅ Exponential backoff reconnection  
✅ Error handling and recovery  
✅ Message history  
✅ TypeScript types  
✅ Memory leak prevention  
✅ Proper cleanup on unmount  

## 🐛 Troubleshooting

**Not connecting?**
- Check `config.apiUrl` is correct
- Verify `accessToken` is valid
- Check browser console for errors

**No streaming text?**
- Verify backend sends `llm_chunk` events
- Check JSON format matches specification
- Look for parsing errors in logs

**Connection drops?**
- Ensure heartbeat events every 30s
- Check network stability
- Increase `maxReconnectAttempts`

## 📚 More Information

See `SSE_IMPLEMENTATION.md` for comprehensive documentation.

## 🎯 Testing

```typescript
// Test the hook in your component
const { status, error, messages } = useChatSSE({
  conversationId: 'test-123',
  accessToken: 'your-token',
  onConnect: () => console.log('Connected!'),
  onError: (err) => console.error('Error:', err),
});

console.log('Status:', status);
console.log('Messages:', messages.length);
```

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Auto-reconnect** | Automatically reconnects with exponential backoff |
| **Streaming** | Real-time text streaming with cursor indicator |
| **Status** | Visual connection status (connected, reconnecting, etc.) |
| **Error Handling** | Graceful error handling with user feedback |
| **TypeScript** | Full TypeScript support with proper types |
| **Memory Safe** | Proper cleanup prevents memory leaks |

## 🌟 Pro Tips

1. **Use the full component** (`ChatSSEComponent`) for quick implementation
2. **Use the hook** (`useChatSSE`) for custom UI
3. **Enable logging** to debug connection issues
4. **Test locally** before deploying
5. **Monitor backend** SSE event format

## 📞 Support

- Check logs with `logger.debug()`
- Review `SSE_IMPLEMENTATION.md` for details
- See `useChatSSE.example.tsx` for more examples

