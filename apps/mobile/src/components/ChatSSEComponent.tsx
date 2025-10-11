import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Animated,
} from 'react-native';
import { TextInput, IconButton, Text, useTheme, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatSSE, ChatSSEMessage } from '@/hooks/useChatSSE';
import { useAuthStore } from '@/stores/auth.store';
import { spacing } from '@/theme';
import { logger } from '@/utils/logger';

interface ChatSSEComponentProps {
  conversationId: string;
  onSendMessage?: (message: string) => Promise<void>;
}

/**
 * Blinking cursor component for streaming messages
 */
const BlinkingCursor: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 530,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 530,
          useNativeDriver: true,
        }),
      ])
    );

    blink.start();

    return () => {
      blink.stop();
    };
  }, [fadeAnim]);

  return (
    <Animated.Text
      style={[
        styles.cursor,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      ▊
    </Animated.Text>
  );
};

/**
 * Connection status indicator
 */
interface ConnectionStatusIndicatorProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ status }) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Connected',
          color: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}22`,
        };
      case 'connecting':
        return {
          label: 'Connecting...',
          color: theme.colors.secondary,
          backgroundColor: `${theme.colors.secondary}22`,
        };
      case 'reconnecting':
        return {
          label: 'Reconnecting...',
          color: theme.colors.tertiary,
          backgroundColor: `${theme.colors.tertiary}22`,
        };
      case 'disconnected':
        return {
          label: 'Disconnected',
          color: theme.colors.error,
          backgroundColor: `${theme.colors.error}22`,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Surface style={styles.statusContainer} elevation={1}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: config.color,
            },
          ]}
        />
        <Text
          variant="labelSmall"
          style={[styles.statusText, { color: config.color }]}
        >
          {config.label}
        </Text>
      </View>
    </Surface>
  );
};

/**
 * Individual message component
 */
interface MessageItemProps {
  message: ChatSSEMessage;
  isStreaming?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isStreaming = false }) => {
  const theme = useTheme();
  const isAssistant = message.type === 'assistant';
  const isSystem = message.type === 'system';

  return (
    <View
      style={[
        styles.messageContainer,
        isAssistant && styles.assistantMessage,
        isSystem && styles.systemMessage,
      ]}
    >
      <Surface
        style={[
          styles.messageBubble,
          isAssistant && {
            backgroundColor: theme.colors.primaryContainer,
          },
          isSystem && {
            backgroundColor: theme.colors.secondaryContainer,
          },
        ]}
        elevation={1}
      >
        {isSystem && (
          <Text variant="labelSmall" style={styles.systemLabel}>
            System
          </Text>
        )}
        <View style={styles.messageContentRow}>
          <Text
            variant="bodyMedium"
            style={[
              styles.messageText,
              isAssistant && {
                color: theme.colors.onPrimaryContainer,
              },
              isSystem && {
                color: theme.colors.onSecondaryContainer,
              },
            ]}
          >
            {message.content}
          </Text>
          {isStreaming && <BlinkingCursor />}
        </View>
        {message.metadata && (
          <Text variant="labelSmall" style={styles.metadataText}>
            {JSON.stringify(message.metadata)}
          </Text>
        )}
        <Text variant="labelSmall" style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </Surface>
    </View>
  );
};

/**
 * Main Chat SSE Component
 */
export const ChatSSEComponent: React.FC<ChatSSEComponentProps> = ({
  conversationId,
  onSendMessage,
}) => {
  const theme = useTheme();
  const { accessToken } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<RNTextInput>(null);

  const {
    status,
    error,
    messages,
    currentStreamingMessage,
    connect,
    disconnect,
  } = useChatSSE({
    conversationId,
    accessToken: accessToken || '',
    enabled: true,
    onConnect: () => {
      logger.info('Chat SSE connected');
    },
    onDisconnect: () => {
      logger.info('Chat SSE disconnected');
    },
    onMessage: (message) => {
      logger.debug('New message received', { messageId: message.id });
    },
    onError: (errorMsg) => {
      logger.error('Chat SSE error', { error: errorMsg });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 || currentStreamingMessage) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, currentStreamingMessage]);

  /**
   * Combine regular messages with current streaming message
   */
  const allMessages = React.useMemo(() => {
    const combinedMessages = [...messages];
    if (currentStreamingMessage) {
      combinedMessages.push(currentStreamingMessage);
    }
    return combinedMessages;
  }, [messages, currentStreamingMessage]);

  /**
   * Handle sending a message
   */
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      if (onSendMessage) {
        await onSendMessage(messageContent);
      }
      logger.info('Message sent', { conversationId });
    } catch (err) {
      logger.error('Failed to send message', { error: err });
      setInputText(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handle reconnection
   */
  const handleReconnect = () => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 500);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Connection Status Indicator */}
        <ConnectionStatusIndicator status={status} />

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item, index) => item.id || `msg-${index}`}
          renderItem={({ item }) => (
            <MessageItem
              message={item}
              isStreaming={item.id === currentStreamingMessage?.id}
            />
          )}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Start a conversation about sports betting!
              </Text>
              {status === 'disconnected' && (
                <IconButton
                  icon="refresh"
                  mode="contained"
                  onPress={handleReconnect}
                  style={styles.reconnectButton}
                />
              )}
            </View>
          }
          accessible
          accessibilityLabel="Chat messages"
        />

        {/* Error Display */}
        {error && (
          <Surface
            style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}
            elevation={2}
          >
            <View style={styles.errorRow}>
              <Text style={{ color: theme.colors.onErrorContainer, flex: 1 }}>
                {error}
              </Text>
              <IconButton
                icon="close"
                size={16}
                onPress={handleReconnect}
                iconColor={theme.colors.onErrorContainer}
              />
            </View>
          </Surface>
        )}

        {/* Input Area */}
        <Surface style={styles.inputContainer} elevation={4}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about sports betting..."
            mode="outlined"
            multiline
            maxLength={500}
            disabled={isSending || status !== 'connected'}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            accessible
            accessibilityLabel="Message input"
            accessibilityHint="Type your message here"
          />
          <IconButton
            icon="send"
            size={24}
            disabled={!inputText.trim() || isSending || status !== 'connected'}
            onPress={handleSend}
            loading={isSending}
            accessible
            accessibilityLabel="Send message"
            accessibilityRole="button"
          />
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    margin: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontWeight: '600',
  },
  messageList: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  systemMessage: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageBubble: {
    borderRadius: 16,
    padding: spacing.md,
  },
  systemLabel: {
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  messageContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageText: {
    flex: 1,
    lineHeight: 20,
  },
  cursor: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
    lineHeight: 20,
  },
  metadataText: {
    marginTop: spacing.xs,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  timestamp: {
    marginTop: spacing.xs,
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: spacing.md,
  },
  reconnectButton: {
    marginTop: spacing.md,
  },
  errorContainer: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 100,
  },
});

