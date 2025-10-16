import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { TextInput, IconButton, ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatMessage } from '@/components/ChatMessage';
import { useChatMessages, useSendMessage } from '@/hooks/useChat';
import { useSSEStream } from '@/hooks/useSSEStream';
import { useUIStore } from '@/stores/ui.store';
import { useChatStore } from '@/stores/chat.store';
import { databaseService } from '@/services/database.service';
import { logger } from '@/utils/logger';
import type { ChatMessage as ChatMessageType } from '@betthink/shared';
import { spacing } from '@/theme';

interface ChatScreenProps {
  threadId: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ threadId }) => {
  const theme = useTheme();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<RNTextInput>(null);

  const { data: messages, isLoading, refetch } = useChatMessages(threadId);
  const sendMessage = useSendMessage(threadId);
  const { openBottomSheet } = useUIStore();
  const { activeStream, streamBuffer } = useChatStore();

  const {
    isStreaming,
    streamedContent,
    error: streamError,
    connectSSE,
    startStreaming,
  } = useSSEStream({
    threadId,
    onComplete: (fullMessage) => {
      // Save completed assistant message to database
      const assistantMessage: ChatMessageType = {
        id: `${threadId}-${Date.now()}`,
        chatId: threadId,
        role: 'assistant',
        content: fullMessage,
        timestamp: new Date().toISOString(),
      };

      databaseService.saveMessage({
        ...assistantMessage,
        localId: assistantMessage.id,
        synced: true,
      });

      // Refetch messages to show the completed message
      refetch();
      
      logger.info('Assistant message saved', { threadId, messageId: assistantMessage.id });
    },
    onError: (error) => {
      logger.error('Stream error in ChatScreen', { error, threadId });
    },
  });

  // Open SSE connection when screen loads
  useEffect(() => {
    // Establish SSE connection when component mounts
    // This creates a persistent connection for receiving LLM responses
    connectSSE();
    
    logger.info('ChatScreen mounted, establishing SSE connection', { threadId });
    
    // Note: Connection cleanup is handled by useSSEStream hook
  }, [threadId]); // Only re-connect if threadId changes, not connectSSE

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, streamedContent]);

  const handleSend = async () => {
    if (!inputText.trim() || sendMessage.isPending || isStreaming) return;

    const messageContent = inputText.trim();
    setInputText('');

    try {
      // Start streaming (sets isStreaming=true, starts timeout)
      startStreaming();

      // Send message - backend will respond via SSE
      await sendMessage.mutateAsync(messageContent);
      
      logger.info('Message sent, waiting for SSE response', { threadId });
    } catch (error) {
      logger.error('Failed to send message', { error, threadId });
      // Reset streaming state on error
      // This will be handled by the timeout, but we can also handle it here
    }
  };

  const handleShowBetRecommendation = (recommendationId: string) => {
    // Fetch recommendation and open bottom sheet
    openBottomSheet('bet-confirmation', { recommendationId });
  };

  const combinedMessages = React.useMemo(() => {
    const allMessages = [...(messages || [])];

    // Add streaming message if active
    if (isStreaming && streamedContent) {
      allMessages.push({
        id: `streaming-${threadId}`,
        chatId: threadId,
        role: 'assistant' as const,
        content: streamedContent,
        timestamp: new Date().toISOString(),
      });
    }

    return allMessages.reverse(); // Most recent at top
  }, [messages, isStreaming, streamedContent, threadId]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={combinedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage message={item} showBetRecommendation={handleShowBetRecommendation} />
          )}
          inverted
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Start a conversation about sports betting!
              </Text>
            </View>
          }
          accessible
          accessibilityLabel="Chat messages"
        />

        {streamError && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={{ color: theme.colors.onErrorContainer }}>{streamError}</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about sports betting..."
            mode="outlined"
            multiline
            maxLength={500}
            disabled={isStreaming || sendMessage.isPending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            accessible
            accessibilityLabel="Message input"
            accessibilityHint="Type your message here"
          />
          <IconButton
            icon="send"
            size={24}
            disabled={!inputText.trim() || isStreaming || sendMessage.isPending}
            onPress={handleSend}
            loading={sendMessage.isPending}
            accessible
            accessibilityLabel="Send message"
            accessibilityRole="button"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingVertical: spacing.md,
    flexGrow: 1,
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
  },
  errorContainer: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
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
