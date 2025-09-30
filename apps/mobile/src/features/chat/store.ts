import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export type ChatThread = {
  id: string;
  title?: string;
  messages: ChatMessage[];
  updatedAt: number;
};

type ChatState = {
  threads: Record<string, ChatThread>;
  upsertThread: (thread: ChatThread) => Promise<void>;
  appendMessage: (threadId: string, message: ChatMessage) => Promise<void>;
  load: () => Promise<void>;
  clear: () => Promise<void>;
};

const STORAGE_KEY = 'betthink_threads_v1';

export const useChatStore = create<ChatState>((set, get) => ({
  threads: {},
  load: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) set({ threads: JSON.parse(raw) });
  },
  clear: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ threads: {} });
  },
  upsertThread: async (thread) => {
    const next = { ...get().threads, [thread.id]: thread };
    set({ threads: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
  appendMessage: async (threadId, message) => {
    const existing = get().threads[threadId] || { id: threadId, messages: [], updatedAt: 0 };
    const nextThread: ChatThread = {
      ...existing,
      messages: [...existing.messages, message],
      updatedAt: Date.now(),
    };
    const next = { ...get().threads, [threadId]: nextThread };
    set({ threads: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
}));

