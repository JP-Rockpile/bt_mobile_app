import { create } from 'zustand';
import { Chat, ChatMessage, ChatsState } from '@types/index';
import chatService from '@services/chat.service';
import { logger } from '@utils/logger';

interface ChatStore extends ChatsState {
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createChat: (title?: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (message: ChatMessage) => void;
  setError: (error: string | null) => void;
  clearActiveChat: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,

  loadChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const chats = await chatService.getChats();
      set({ chats, isLoading: false });
      logger.info('Chats loaded', { count: chats.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chats';
      set({ error: errorMessage, isLoading: false });
      logger.error('Failed to load chats', error);
    }
  },

  selectChat: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const chat = await chatService.getChat(chatId);
      if (chat) {
        set({ activeChat: chat, isLoading: false });
        
        // Subscribe to message updates
        const unsubscribeMessages = chatService.subscribeToMessages(chatId, (message) => {
          get().updateMessage(message);
        });
        
        const unsubscribeErrors = chatService.subscribeToErrors(chatId, (error) => {
          set({ error: error.message });
        });
        
        // Store unsubscribe functions for cleanup
        (window as any).__chatUnsubscribe = () => {
          unsubscribeMessages();
          unsubscribeErrors();
        };
        
        logger.info('Chat selected', { chatId });
      } else {
        set({ error: 'Chat not found', isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select chat';
      set({ error: errorMessage, isLoading: false });
      logger.error('Failed to select chat', error);
    }
  },

  createChat: async (title?: string) => {
    set({ isLoading: true, error: null });
    try {
      const chat = await chatService.createChat(title);
      const chats = [...get().chats, chat];
      set({ chats, activeChat: chat, isLoading: false });
      logger.info('Chat created', { chatId: chat.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chat';
      set({ error: errorMessage, isLoading: false });
      logger.error('Failed to create chat', error);
    }
  },

  sendMessage: async (content: string) => {
    const { activeChat } = get();
    if (!activeChat) {
      set({ error: 'No active chat' });
      return;
    }

    set({ error: null });
    try {
      await chatService.sendMessage(activeChat.id, content);
      logger.info('Message sent', { chatId: activeChat.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: errorMessage });
      logger.error('Failed to send message', error);
    }
  },

  deleteChat: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      await chatService.deleteChat(chatId);
      const chats = get().chats.filter(c => c.id !== chatId);
      const activeChat = get().activeChat?.id === chatId ? null : get().activeChat;
      set({ chats, activeChat, isLoading: false });
      logger.info('Chat deleted', { chatId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete chat';
      set({ error: errorMessage, isLoading: false });
      logger.error('Failed to delete chat', error);
    }
  },

  addMessage: (message: ChatMessage) => {
    const { activeChat, chats } = get();
    if (!activeChat || activeChat.id !== message.chatId) return;

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, message],
      lastMessageAt: message.createdAt
    };

    const updatedChats = chats.map(c => c.id === message.chatId ? updatedChat : c);
    set({ activeChat: updatedChat, chats: updatedChats });
  },

  updateMessage: (message: ChatMessage) => {
    const { activeChat, chats } = get();
    if (!activeChat || activeChat.id !== message.chatId) return;

    const messageIndex = activeChat.messages.findIndex(m => m.id === message.id);
    
    if (messageIndex >= 0) {
      // Update existing message
      const updatedMessages = [...activeChat.messages];
      updatedMessages[messageIndex] = message;
      
      const updatedChat = {
        ...activeChat,
        messages: updatedMessages,
        lastMessageAt: message.createdAt
      };
      
      const updatedChats = chats.map(c => c.id === message.chatId ? updatedChat : c);
      set({ activeChat: updatedChat, chats: updatedChats });
    } else {
      // Add new message
      get().addMessage(message);
    }
  },

  setError: (error) => set({ error }),

  clearActiveChat: () => {
    // Cleanup subscriptions
    if ((window as any).__chatUnsubscribe) {
      (window as any).__chatUnsubscribe();
      delete (window as any).__chatUnsubscribe;
    }
    set({ activeChat: null });
  }
}));