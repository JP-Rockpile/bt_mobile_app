import apiClient from './api.client';
import { Chat, ChatMessage, BetRecommendation } from '@types/index';
import { logger } from '@utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CHATS: 'chats_cache',
  ACTIVE_CHAT: 'active_chat_id'
};

class ChatService {
  private messageCallbacks: Map<string, (message: ChatMessage) => void> = new Map();
  private errorCallbacks: Map<string, (error: Error) => void> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  async getChats(): Promise<Chat[]> {
    try {
      const response = await apiClient.get<Chat[]>('/chats');
      if (response.data) {
        await this.cacheChats(response.data);
        return response.data;
      }
      
      // Fallback to cached data if API fails
      return await this.getCachedChats();
    } catch (error) {
      logger.error('Failed to fetch chats', error);
      return await this.getCachedChats();
    }
  }

  async getChat(chatId: string): Promise<Chat | null> {
    try {
      const response = await apiClient.get<Chat>(`/chats/${chatId}`);
      if (response.data) {
        await this.updateCachedChat(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      logger.error('Failed to fetch chat', error);
      return await this.getCachedChat(chatId);
    }
  }

  async createChat(title?: string): Promise<Chat> {
    const response = await apiClient.post<Chat>('/chats', { title });
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    const chat = response.data!;
    await this.updateCachedChat(chat);
    return chat;
  }

  async sendMessage(chatId: string, content: string): Promise<void> {
    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      chatId,
      role: 'user',
      content,
      createdAt: new Date()
    };

    // Notify UI immediately
    const callback = this.messageCallbacks.get(chatId);
    if (callback) {
      callback(optimisticMessage);
    }

    // Start streaming response
    await this.streamChatResponse(chatId, content);
  }

  async streamChatResponse(chatId: string, message: string): Promise<void> {
    const abortController = new AbortController();
    this.abortControllers.set(chatId, abortController);

    try {
      let currentMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        chatId,
        role: 'assistant',
        content: '',
        metadata: { isStreaming: true },
        createdAt: new Date()
      };

      const callback = this.messageCallbacks.get(chatId);
      let betRecommendation: BetRecommendation | undefined;

      for await (const chunk of apiClient.streamSSE('/chat/stream', { chatId, message })) {
        if (abortController.signal.aborted) {
          break;
        }

        if (chunk.type === 'content') {
          currentMessage.content += chunk.data;
          if (callback) {
            callback({ ...currentMessage });
          }
        } else if (chunk.type === 'bet_recommendation') {
          betRecommendation = chunk.data as BetRecommendation;
          currentMessage.metadata = {
            ...currentMessage.metadata,
            betRecommendation
          };
        } else if (chunk.type === 'error') {
          throw new Error(chunk.data);
        }
      }

      // Mark streaming as complete
      currentMessage.metadata = {
        ...currentMessage.metadata,
        isStreaming: false
      };

      if (callback) {
        callback(currentMessage);
      }

      // Update cache
      await this.addMessageToCache(chatId, currentMessage);
    } catch (error) {
      logger.error('Stream chat response failed', error);
      const errorCallback = this.errorCallbacks.get(chatId);
      if (errorCallback) {
        errorCallback(error as Error);
      }
    } finally {
      this.abortControllers.delete(chatId);
    }
  }

  subscribeToMessages(chatId: string, callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.set(chatId, callback);
    
    return () => {
      this.messageCallbacks.delete(chatId);
      this.stopStreaming(chatId);
    };
  }

  subscribeToErrors(chatId: string, callback: (error: Error) => void): () => void {
    this.errorCallbacks.set(chatId, callback);
    
    return () => {
      this.errorCallbacks.delete(chatId);
    };
  }

  stopStreaming(chatId: string): void {
    const controller = this.abortControllers.get(chatId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(chatId);
    }
  }

  // Local storage methods
  private async cacheChats(chats: Chat[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch (error) {
      logger.error('Failed to cache chats', error);
    }
  }

  private async getCachedChats(): Promise<Chat[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error('Failed to get cached chats', error);
    }
    return [];
  }

  private async getCachedChat(chatId: string): Promise<Chat | null> {
    const chats = await this.getCachedChats();
    return chats.find(c => c.id === chatId) || null;
  }

  private async updateCachedChat(chat: Chat): Promise<void> {
    const chats = await this.getCachedChats();
    const index = chats.findIndex(c => c.id === chat.id);
    
    if (index >= 0) {
      chats[index] = chat;
    } else {
      chats.push(chat);
    }
    
    await this.cacheChats(chats);
  }

  private async addMessageToCache(chatId: string, message: ChatMessage): Promise<void> {
    const chat = await this.getCachedChat(chatId);
    if (chat) {
      chat.messages.push(message);
      chat.lastMessageAt = message.createdAt;
      await this.updateCachedChat(chat);
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    const response = await apiClient.delete(`/chats/${chatId}`);
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    // Remove from cache
    const chats = await this.getCachedChats();
    const filtered = chats.filter(c => c.id !== chatId);
    await this.cacheChats(filtered);
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.CHATS);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
  }
}

export default new ChatService();