import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/react-query';
import { chatApi } from '@/api/endpoints';
import { databaseService } from '@/services/database.service';
import { logger } from '@/utils/logger';
import { analyticsService } from '@/services/analytics.service';
import type { Conversation, ChatMessage, LocalChatMessage } from '@betthink/shared';
import { v4 as uuidv4 } from 'uuid';

export const useChatThreads = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.chat.threads(),
    queryFn: async () => {
      // Try to get from local database first
      const localThreads = await databaseService.getThreads(userId);

      // Fetch from API in background
      try {
        const response = await chatApi.getThreads({ page: 1, limit: 50 });
        
        // Sync to local database
        await Promise.all(
          response.conversations.map((thread) => databaseService.saveThread(thread as any))
        );

        return response.conversations as any;
      } catch (error) {
        logger.error('Failed to fetch threads from API, using local cache', error);
        return localThreads;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useChatThread = (threadId: string) => {
  return useQuery({
    queryKey: queryKeys.chat.thread(threadId),
    queryFn: async () => {
      try {
        return await chatApi.getThread(threadId);
      } catch (error) {
        // Fallback to local database
        const localThread = await databaseService.getThread(threadId);
        if (!localThread) throw error;
        return localThread;
      }
    },
    enabled: !!threadId,
  });
};

export const useChatMessages = (threadId: string) => {
  return useQuery({
    queryKey: queryKeys.chat.messages(threadId),
    queryFn: async () => {
      // Get local messages first for instant display
      const localMessages = await databaseService.getMessages(threadId);

      // Fetch from API
      try {
        const apiMessages = await chatApi.getMessages(threadId, { page: 1, limit: 100 });

        // Sync to local database
        await Promise.all(
          apiMessages.map((msg) =>
            databaseService.saveMessage({
              ...msg,
              localId: msg.id,
              synced: true,
            })
          )
        );

        return apiMessages;
      } catch (error) {
        logger.error('Failed to fetch messages from API, using local cache', error);
        return localMessages;
      }
    },
    enabled: !!threadId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { title?: string; initialMessage?: string } | string) => {
      // Handle both old format (string) and new format (object) for backwards compatibility
      let title: string | undefined;
      let initialMessage: string | undefined;
      
      if (typeof params === 'string') {
        title = params;
      } else if (params) {
        title = params.title;
        initialMessage = params.initialMessage;
      }
      
      const thread = await chatApi.createThread(title, initialMessage);
      await databaseService.saveThread(thread);
      return thread;
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.threads() });
      logger.info('Chat thread created', { threadId: thread.id });
    },
    onError: (error) => {
      logger.error('Failed to create chat thread', error);
    },
  });
};

export const useDeleteThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      await chatApi.deleteThread(threadId);
      await databaseService.deleteThread(threadId);
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.threads() });
      queryClient.removeQueries({ queryKey: queryKeys.chat.thread(threadId) });
      queryClient.removeQueries({ queryKey: queryKeys.chat.messages(threadId) });
      logger.info('Chat thread deleted', { threadId });
    },
    onError: (error) => {
      logger.error('Failed to delete chat thread', error);
    },
  });
};

export const useSendMessage = (threadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const localId = uuidv4();
      const timestamp = new Date().toISOString();

      // Optimistic update: Save to local database immediately
      const optimisticMessage: LocalChatMessage = {
        id: localId,
        localId,
        chatId: threadId,
        role: 'user',
        content,
        timestamp,
        synced: false,
        optimistic: true,
      };

      await databaseService.saveMessage(optimisticMessage);

      // Update UI optimistically
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(threadId),
        (old) => [...(old || []), optimisticMessage]
      );

      // Send to API
      const apiMessage = await chatApi.sendMessage(threadId, content);

      // Mark as synced
      await databaseService.markMessageAsSynced(localId, apiMessage.id);

      // Track analytics
      analyticsService.trackChatMessageSent(threadId, content.length);

      return apiMessage;
    },
    onSuccess: (apiMessage) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(threadId),
        (old) =>
          (old || []).map((msg) => (msg.id === apiMessage.id ? apiMessage : msg))
      );

      logger.info('Message sent successfully', { messageId: apiMessage.id });
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(threadId) });
      logger.error('Failed to send message', { error, content: variables });
    },
  });
};

export const useSyncMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const unsyncedMessages = await databaseService.getUnsyncedMessages();

      const results = await Promise.allSettled(
        unsyncedMessages.map(async (msg) => {
          try {
            const apiMessage = await chatApi.sendMessage(msg.chatId, msg.content);
            await databaseService.markMessageAsSynced(msg.localId, apiMessage.id);
            return { success: true, localId: msg.localId, apiMessage };
          } catch (error) {
            logger.error('Failed to sync message', { localId: msg.localId, error });
            return { success: false, localId: msg.localId, error };
          }
        })
      );

      return results;
    },
    onSuccess: (results) => {
      const syncedCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      logger.info('Message sync completed', { syncedCount, total: results.length });

      // Invalidate all message queries to refresh UI
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
    },
    onError: (error) => {
      logger.error('Message sync failed', error);
    },
  });
};
