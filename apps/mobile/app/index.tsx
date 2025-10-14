import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCreateThread, useSendMessage, useChatMessages } from '../src/hooks/useChat';
import { useSSEStream } from '../src/hooks/useSSEStream';
import { databaseService } from '../src/services/database.service';
import { useAuthStore } from '../src/stores/auth.store';
import type { ChatMessage as ChatMessageType } from '@betthink/shared';
import LandingScreen from '../src/screens/LandingScreen';

const EXAMPLE_PROMPTS = [
  {
    title: 'Analyze tonight\'s NBA games',
    subtitle: 'Show me the best betting opportunities',
  },
  {
    title: 'What\'s the value in Premier League?',
    subtitle: 'Find undervalued bets this weekend',
  },
  {
    title: 'Explain point spread betting',
    subtitle: 'Help me understand the basics',
  },
  {
    title: 'Compare NFL teams',
    subtitle: 'Chiefs vs Bills head-to-head stats',
  },
];

export default function Page() {
  const [inputText, setInputText] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user, isAuthenticated, login, logout } = useAuthStore();

  // Hooks for conversation and message management
  const createThread = useCreateThread();
  const { data: messages = [], refetch: refetchMessages } = useChatMessages(currentConversationId || '');
  const sendMessage = useSendMessage(currentConversationId || '');

  // SSE streaming for real-time responses
  const {
    isStreaming,
    streamedContent,
    error: streamError,
    startStreaming,
  } = useSSEStream({
    threadId: currentConversationId || '',
    onComplete: async (fullMessage) => {
      // Save completed assistant message to database
      if (currentConversationId) {
        const assistantMessage: ChatMessageType = {
          id: `${currentConversationId}-${Date.now()}`,
          chatId: currentConversationId,
          role: 'assistant',
          content: fullMessage,
          timestamp: new Date().toISOString(),
        };

        await databaseService.saveMessage({
          ...assistantMessage,
          localId: assistantMessage.id,
          synced: true,
        });

        refetchMessages();
      }
    },
    onError: (error) => {
      console.error('Stream error:', error);
    },
  });

  const handleSend = async () => {
    if (!inputText.trim() || sendMessage.isPending || isStreaming) return;

    const userMessage = inputText.trim();
    setInputText('');

    try {
      // Create thread if this is the first message
      if (!currentConversationId) {
        const thread = await createThread.mutateAsync({
          title: 'Betting Chat',
          initialMessage: userMessage,
        });
        
        // Set conversation ID and flag that we need to start streaming
        setCurrentConversationId(thread.id);
        setNeedsStreaming(true); // useEffect will start streaming once state updates
      } else {
        // Send message to existing conversation
        await sendMessage.mutateAsync(userMessage);
        
        // Start streaming response
        startStreaming();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handlePromptPress = (prompt: string) => {
    setInputText(prompt);
    inputRef.current?.focus();
  };

  const handleSignIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      setMenuVisible(false);
      // This calls Auth0's clearSession and clears stored credentials
      await logout();
      // Clear conversation state
      setCurrentConversationId(null);
      setInputText('');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleNewChat = () => {
    setMenuVisible(false);
    setCurrentConversationId(null);
    setInputText('');
  };

  const handleTermsOfUse = () => {
    setMenuVisible(false);
    // TODO: Navigate to Terms of Use screen or open web view
    console.log('Terms of Use pressed');
  };

  const handlePrivacyPolicy = () => {
    setMenuVisible(false);
    // TODO: Navigate to Privacy Policy screen or open web view
    console.log('Privacy Policy pressed');
  };

  const handleSettings = () => {
    setMenuVisible(false);
    // TODO: Navigate to Settings screen
    console.log('Settings pressed');
  };

  // Track if we just created a new conversation that needs streaming
  const [needsStreaming, setNeedsStreaming] = useState(false);

  // Start streaming after conversation is created and state has updated
  useEffect(() => {
    if (needsStreaming && currentConversationId && !isStreaming) {
      setNeedsStreaming(false);
      startStreaming();
    }
  }, [needsStreaming, currentConversationId, isStreaming, startStreaming]);

  // Combine messages with streaming content
  const displayMessages = useMemo(() => {
    const allMessages = [...messages];

    // Add streaming message if active
    if (isStreaming && streamedContent && currentConversationId) {
      allMessages.push({
        id: `streaming-${currentConversationId}`,
        chatId: currentConversationId,
        role: 'assistant' as const,
        content: streamedContent,
        timestamp: new Date().toISOString(),
      });
    }

    return allMessages;
  }, [messages, isStreaming, streamedContent, currentConversationId]);

  const showChat = displayMessages.length > 0;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (showChat) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayMessages.length, showChat]);

  // Show landing screen if not authenticated
  if (!isAuthenticated) {
    return <LandingScreen onAuthenticated={() => {}} />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.menuButton} onPress={toggleMenu}>
              <Ionicons name="menu" size={24} color="#ECECEC" />
            </Pressable>
            <Text style={styles.headerTitle}>BetGPT</Text>
            {!isAuthenticated ? (
              <Pressable style={styles.signupButton} onPress={handleSignIn}>
                <Text style={styles.signupText}>Sign in</Text>
              </Pressable>
            ) : (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.email || 'User'}</Text>
              </View>
            )}
          </View>

          {/* Menu Modal */}
          <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
              <View style={styles.menuContainer}>
                {/* New Chat Button */}
                <TouchableOpacity
                  style={styles.newChatButton}
                  onPress={handleNewChat}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={20} color="#ECECEC" />
                  <Text style={styles.newChatText}>New chat</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                {/* Menu Items */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleTermsOfUse}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemText}>Terms of Use</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handlePrivacyPolicy}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemText}>Privacy Policy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSettings}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemText}>Settings</Text>
                </TouchableOpacity>

                {isAuthenticated && (
                  <>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleSignOut}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                      <Text style={styles.menuItemTextSignOut}>Sign Out</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Pressable>
          </Modal>

          {/* Main Content */}
          {!showChat ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Example Prompts */}
              <View style={styles.promptsContainer}>
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.promptCard}
                    onPress={() => handlePromptPress(prompt.title)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.promptTitle}>{prompt.title}</Text>
                    <Text style={styles.promptSubtitle}>{prompt.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatContainer}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {displayMessages.map((message, index) => (
                <View
                  key={message.id || index}
                  style={[
                    styles.messageContainer,
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.role === 'user' ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              ))}
              {sendMessage.isPending && !isStreaming && (
                <View style={[styles.messageContainer, styles.assistantMessage]}>
                  <View style={[styles.messageBubble, styles.assistantBubble]}>
                    <ActivityIndicator size="small" color="#8E8E93" />
                  </View>
                </View>
              )}
              {streamError && (
                <View style={[styles.messageContainer, styles.assistantMessage]}>
                  <View style={[styles.messageBubble, styles.errorBubble]}>
                    <Text style={styles.errorText}>{streamError}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Input Container */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add-circle-outline" size={24} color="#8E8E93" />
              </TouchableOpacity>
              
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Ask anything about betting..."
                placeholderTextColor="#8E8E93"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />

              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic" size={20} color="#8E8E93" />
              </TouchableOpacity>

              {inputText.trim().length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (sendMessage.isPending || isStreaming) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={sendMessage.isPending || isStreaming}
                >
                  {sendMessage.isPending || isStreaming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECEC',
  },
  signupButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  signupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  userInfo: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ECECEC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  promptsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  promptCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECECEC',
    marginBottom: 4,
  },
  promptSubtitle: {
    fontSize: 14,
    color: '#98989D',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#0A84FF',
  },
  assistantBubble: {
    backgroundColor: '#2C2C2E',
  },
  errorBubble: {
    backgroundColor: '#3A2C2C',
    borderWidth: 1,
    borderColor: '#8B4545',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#ECECEC',
  },
  errorText: {
    color: '#FF6B6B',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2C2C2E',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  addButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ECECEC',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4A5E7B',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    marginTop: 60,
    marginLeft: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    minWidth: 260,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  newChatText: {
    fontSize: 16,
    color: '#ECECEC',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  menuItemText: {
    fontSize: 15,
    color: '#ECECEC',
    fontWeight: '400',
  },
  menuItemTextSignOut: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});
