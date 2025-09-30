import { create } from 'zustand';
import type { ChatThread, ChatMessage, StreamChunk } from '@shared/types';

interface ActiveStream {
  threadId: string;
  isStreaming: boolean;
  currentMessage: string;
  error: string | null;
}

interface ChatState {
  activeThreadId: string | null;
  activeStream: ActiveStream | null;
  streamBuffer: Map<string, string>;

  // Actions
  setActiveThread: (threadId: string | null) => void;
  startStream: (threadId: string) => void;
  appendStreamChunk: (threadId: string, chunk: StreamChunk) => void;
  endStream: (threadId: string) => void;
  setStreamError: (threadId: string, error: string) => void;
  clearStreamBuffer: (threadId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeThreadId: null,
  activeStream: null,
  streamBuffer: new Map(),

  setActiveThread: (threadId) => {
    set({ activeThreadId: threadId });
  },

  startStream: (threadId) => {
    set({
      activeStream: {
        threadId,
        isStreaming: true,
        currentMessage: '',
        error: null,
      },
    });
  },

  appendStreamChunk: (threadId, chunk) => {
    const { activeStream, streamBuffer } = get();

    if (chunk.type === 'content' && chunk.content) {
      const currentBuffer = streamBuffer.get(threadId) || '';
      const newBuffer = currentBuffer + chunk.content;
      
      const newStreamBuffer = new Map(streamBuffer);
      newStreamBuffer.set(threadId, newBuffer);

      set({
        streamBuffer: newStreamBuffer,
        activeStream: activeStream?.threadId === threadId
          ? { ...activeStream, currentMessage: newBuffer }
          : activeStream,
      });
    } else if (chunk.type === 'error') {
      set({
        activeStream: activeStream?.threadId === threadId
          ? {
              ...activeStream,
              isStreaming: false,
              error: chunk.error || 'Stream error occurred',
            }
          : activeStream,
      });
    } else if (chunk.type === 'done') {
      set({
        activeStream: activeStream?.threadId === threadId
          ? { ...activeStream, isStreaming: false }
          : activeStream,
      });
    }
  },

  endStream: (threadId) => {
    const { activeStream } = get();
    
    if (activeStream?.threadId === threadId) {
      set({ activeStream: null });
    }
  },

  setStreamError: (threadId, error) => {
    const { activeStream } = get();

    if (activeStream?.threadId === threadId) {
      set({
        activeStream: {
          ...activeStream,
          isStreaming: false,
          error,
        },
      });
    }
  },

  clearStreamBuffer: (threadId) => {
    const { streamBuffer } = get();
    const newStreamBuffer = new Map(streamBuffer);
    newStreamBuffer.delete(threadId);
    set({ streamBuffer: newStreamBuffer });
  },
}));
