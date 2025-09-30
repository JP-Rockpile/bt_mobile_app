import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '@store/chat.store';
import { useAuthStore } from '@store/auth.store';
import ChatMessage from '@components/ChatMessage';
import BetConfirmationSheet, { BetConfirmationSheetRef } from '@components/BetConfirmationSheet';
import { BetRecommendation } from '@types/index';
import { logger } from '@utils/logger';

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const betSheetRef = useRef<BetConfirmationSheetRef>(null);
  const [inputText, setInputText] = useState('');
  const [selectedBet, setSelectedBet] = useState<BetRecommendation | null>(null);
  
  const { activeChat, isLoading, error, sendMessage, createChat, selectChat } = useChatStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Create or select a chat on mount
    if (!activeChat) {
      initializeChat();
    }
  }, [isAuthenticated]);

  const initializeChat = async () => {
    try {
      // For now, create a new chat. In production, you might want to load the most recent one
      await createChat('New Conversation');
    } catch (error) {
      logger.error('Failed to initialize chat', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeChat) return;
    
    const message = inputText.trim();
    setInputText('');
    
    try {
      await sendMessage(message);
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      logger.error('Failed to send message', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [inputText, activeChat, sendMessage]);

  const handleBetPress = useCallback((bet: BetRecommendation) => {
    setSelectedBet(bet);
    betSheetRef.current?.open();
  }, []);

  const handleBetConfirm = useCallback(async (bet: BetRecommendation) => {
    try {
      // Log analytics event
      logger.info('Bet confirmed', { betId: bet.id });
      
      // Here you would typically:
      // 1. Track the bet confirmation in your backend
      // 2. Update analytics
      // 3. Handle the deep link opening (already handled in BetConfirmationSheet)
      
      Alert.alert(
        'Redirecting to Sportsbook',
        `Opening ${bet.sportsbook.name} to complete your bet.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error('Failed to confirm bet', error);
      Alert.alert('Error', 'Failed to process bet. Please try again.');
    }
  }, []);

  const handleBetCancel = useCallback(() => {
    setSelectedBet(null);
    betSheetRef.current?.close();
  }, []);

  const renderMessage = useCallback(({ item }: { item: any }) => (
    <ChatMessage message={item} onBetPress={handleBetPress} />
  ), [handleBetPress]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Welcome to Bet Think!</Text>
      <Text style={styles.emptyStateText}>
        I'm your AI sports betting assistant. Ask me about upcoming games, betting strategies, or get personalized recommendations.
      </Text>
      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>Try asking:</Text>
        <Pressable style={styles.suggestionChip} onPress={() => setInputText("What are the best NFL bets for this weekend?")}>
          <Text style={styles.suggestionText}>What are the best NFL bets for this weekend?</Text>
        </Pressable>
        <Pressable style={styles.suggestionChip} onPress={() => setInputText("Analyze the Lakers vs Warriors game tonight")}>
          <Text style={styles.suggestionText}>Analyze the Lakers vs Warriors game</Text>
        </Pressable>
        <Pressable style={styles.suggestionChip} onPress={() => setInputText("What's a good parlay for today?")}>
          <Text style={styles.suggestionText}>What's a good parlay for today?</Text>
        </Pressable>
      </View>
    </View>
  );

  if (isLoading && !activeChat) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bet Think Assistant</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={activeChat?.messages || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          inverted={false}
        />

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about sports betting..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            blurOnSubmit
          />
          <Pressable
            onPress={handleSendMessage}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <BetConfirmationSheet
        ref={betSheetRef}
        recommendation={selectedBet}
        onConfirm={handleBetConfirm}
        onCancel={handleBetCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#616161',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  suggestions: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    fontSize: 16,
    color: '#212121',
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});