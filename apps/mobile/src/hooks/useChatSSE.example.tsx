/**
 * Example Usage of useChatSSE Hook
 * 
 * This file demonstrates various ways to use the useChatSSE hook
 * for implementing real-time chat with Server-Sent Events (SSE).
 */

import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useChatSSE } from './useChatSSE';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Example 1: Basic Usage
 * Simple implementation with minimal configuration
 */
export function BasicChatExample() {
  const { accessToken } = useAuthStore();
  
  const { status, messages, currentStreamingMessage } = useChatSSE({
    conversationId: 'conversation-123',
    accessToken: accessToken || '',
  });

  return (
    <View>
      <Text>Status: {status}</Text>
      <FlatList
        data={messages}
        renderItem={({ item }) => <Text>{item.content}</Text>}
        keyExtractor={(item) => item.id}
      />
      {currentStreamingMessage && (
        <Text>{currentStreamingMessage.content}▊</Text>
      )}
    </View>
  );
}

/**
 * Example 2: With Manual Control
 * Connect/disconnect manually instead of auto-connect
 */
export function ManualControlExample() {
  const { accessToken } = useAuthStore();
  
  const { 
    status, 
    messages, 
    connect, 
    disconnect,
    clearMessages 
  } = useChatSSE({
    conversationId: 'conversation-456',
    accessToken: accessToken || '',
    enabled: false,  // Don't auto-connect
  });

  return (
    <View>
      <Text>Status: {status}</Text>
      <Button title="Connect" onPress={connect} />
      <Button title="Disconnect" onPress={disconnect} />
      <Button title="Clear" onPress={clearMessages} />
      <Text>Messages: {messages.length}</Text>
    </View>
  );
}

/**
 * Example 3: With Callbacks
 * Use callbacks to react to events
 */
export function CallbackExample() {
  const { accessToken } = useAuthStore();
  const [eventLog, setEventLog] = React.useState<string[]>([]);

  const logEvent = (message: string) => {
    setEventLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const { status, error } = useChatSSE({
    conversationId: 'conversation-789',
    accessToken: accessToken || '',
    
    onConnect: () => {
      logEvent('Connected to chat stream');
    },
    
    onDisconnect: () => {
      logEvent('Disconnected from chat stream');
    },
    
    onMessage: (message) => {
      logEvent(`New message: ${message.content.substring(0, 30)}...`);
    },
    
    onError: (error) => {
      logEvent(`Error: ${error}`);
    },
  });

  return (
    <View>
      <Text>Status: {status}</Text>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Text>Event Log:</Text>
      {eventLog.map((log, index) => (
        <Text key={index}>{log}</Text>
      ))}
    </View>
  );
}

/**
 * Example 4: Custom Reconnection Strategy
 * Configure reconnection behavior
 */
export function CustomReconnectionExample() {
  const { accessToken } = useAuthStore();
  
  const { status, error } = useChatSSE({
    conversationId: 'conversation-abc',
    accessToken: accessToken || '',
    maxReconnectAttempts: 10,  // Try reconnecting 10 times
    reconnectDelay: 1000,       // Start with 1s delay (exponential backoff)
  });

  return (
    <View>
      <Text>Status: {status}</Text>
      {status === 'reconnecting' && (
        <Text>Attempting to reconnect...</Text>
      )}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}

/**
 * Example 5: With Message Type Filtering
 * Filter and display different message types separately
 */
export function MessageTypeFilteringExample() {
  const { accessToken } = useAuthStore();
  
  const { messages, currentStreamingMessage } = useChatSSE({
    conversationId: 'conversation-def',
    accessToken: accessToken || '',
  });

  const assistantMessages = messages.filter(m => m.type === 'assistant');
  const systemMessages = messages.filter(m => m.type === 'system');

  return (
    <View>
      <Text>Assistant Messages:</Text>
      {assistantMessages.map(msg => (
        <View key={msg.id}>
          <Text>{msg.content}</Text>
        </View>
      ))}
      
      <Text>System Notifications:</Text>
      {systemMessages.map(msg => (
        <View key={msg.id}>
          <Text>{msg.content}</Text>
          {msg.metadata && (
            <Text style={{ fontSize: 12 }}>
              {JSON.stringify(msg.metadata)}
            </Text>
          )}
        </View>
      ))}
      
      {currentStreamingMessage && (
        <View>
          <Text>Currently streaming:</Text>
          <Text>{currentStreamingMessage.content}▊</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Example 6: Integration with useEffect
 * Perform side effects based on hook state
 */
export function SideEffectsExample() {
  const { accessToken } = useAuthStore();
  const [notificationCount, setNotificationCount] = React.useState(0);
  
  const { messages, status } = useChatSSE({
    conversationId: 'conversation-ghi',
    accessToken: accessToken || '',
  });

  // Show notification when new message arrives
  React.useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === 'system') {
        setNotificationCount(prev => prev + 1);
        // Could trigger native notification here
      }
    }
  }, [messages]);

  // Log status changes
  React.useEffect(() => {
    console.log('Connection status changed:', status);
  }, [status]);

  return (
    <View>
      <Text>Status: {status}</Text>
      <Text>System Notifications: {notificationCount}</Text>
      <Text>Total Messages: {messages.length}</Text>
    </View>
  );
}

/**
 * Example 7: Error Handling and Recovery
 * Comprehensive error handling with user feedback
 */
export function ErrorHandlingExample() {
  const { accessToken } = useAuthStore();
  const [lastError, setLastError] = React.useState<string | null>(null);
  
  const { 
    status, 
    error, 
    connect,
    clearMessages 
  } = useChatSSE({
    conversationId: 'conversation-jkl',
    accessToken: accessToken || '',
    
    onError: (errorMsg) => {
      setLastError(errorMsg);
      // Could also log to error tracking service
      console.error('SSE Error:', errorMsg);
    },
  });

  const handleRetry = () => {
    setLastError(null);
    clearMessages();
    connect();
  };

  return (
    <View>
      <Text>Status: {status}</Text>
      
      {error && (
        <View style={{ backgroundColor: '#ffeeee', padding: 10 }}>
          <Text style={{ color: 'red' }}>Error: {error}</Text>
          <Button title="Retry" onPress={handleRetry} />
        </View>
      )}
      
      {lastError && (
        <View>
          <Text>Last Error: {lastError}</Text>
        </View>
      )}
      
      {status === 'disconnected' && !error && (
        <View>
          <Text>Disconnected</Text>
          <Button title="Reconnect" onPress={connect} />
        </View>
      )}
    </View>
  );
}

/**
 * Example 8: Real-world Integration
 * Complete example with sending messages and displaying chat
 */
export function CompleteIntegrationExample() {
  const { accessToken } = useAuthStore();
  const [inputText, setInputText] = React.useState('');
  
  const { 
    status,
    error,
    messages,
    currentStreamingMessage,
    connect,
  } = useChatSSE({
    conversationId: 'conversation-mno',
    accessToken: accessToken || '',
    
    onConnect: () => console.log('Chat connected'),
    onMessage: (msg) => console.log('New message:', msg.id),
  });

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    try {
      // Send message to API
      await fetch('/api/chat/conversations/conversation-mno/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: inputText }),
      });
      
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const allMessages = React.useMemo(() => {
    const all = [...messages];
    if (currentStreamingMessage) {
      all.push(currentStreamingMessage);
    }
    return all;
  }, [messages, currentStreamingMessage]);

  return (
    <View style={{ flex: 1 }}>
      {/* Status Bar */}
      <View style={{ padding: 10, backgroundColor: status === 'connected' ? '#e8f5e9' : '#ffebee' }}>
        <Text>Status: {status}</Text>
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        {status === 'disconnected' && (
          <Button title="Reconnect" onPress={connect} />
        )}
      </View>
      
      {/* Messages */}
      <FlatList
        data={allMessages}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>
              {item.type === 'assistant' ? 'AI' : 'System'}
            </Text>
            <Text>
              {item.content}
              {item.isStreaming && '▊'}
            </Text>
            <Text style={{ fontSize: 10, color: '#666' }}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
      
      {/* Input */}
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, marginRight: 10 }}
        />
        <Button
          title="Send"
          onPress={handleSendMessage}
          disabled={!inputText.trim() || status !== 'connected'}
        />
      </View>
    </View>
  );
}

