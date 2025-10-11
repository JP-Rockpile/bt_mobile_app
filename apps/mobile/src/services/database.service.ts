import * as SQLite from 'expo-sqlite';
import { logger } from '@/utils/logger';
import type { LocalChatMessage, Conversation as ChatThread } from '@betthink/shared';

const DB_NAME = 'betthink.db';
const DB_VERSION = 1;

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS chat_threads (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        lastMessageAt TEXT,
        messageCount INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        localId TEXT UNIQUE NOT NULL,
        chatId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        synced INTEGER DEFAULT 0,
        optimistic INTEGER DEFAULT 0,
        FOREIGN KEY (chatId) REFERENCES chat_threads(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_chatId ON chat_messages(chatId);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON chat_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_synced ON chat_messages(synced);
      CREATE INDEX IF NOT EXISTS idx_threads_updatedAt ON chat_threads(updatedAt);
    `);
  }

  // Thread operations
  async saveThread(thread: ChatThread): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO chat_threads 
       (id, userId, title, createdAt, updatedAt, lastMessageAt, messageCount, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        thread.id,
        thread.userId,
        thread.title,
        thread.createdAt,
        thread.updatedAt,
        thread.lastMessageAt || null,
        thread.messageCount,
        1, // synced
      ]
    );
  }

  async getThreads(userId: string, limit = 50): Promise<ChatThread[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<ChatThread>(
      `SELECT id, userId, title, createdAt, updatedAt, lastMessageAt, messageCount
       FROM chat_threads 
       WHERE userId = ?
       ORDER BY updatedAt DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows;
  }

  async getThread(threadId: string): Promise<ChatThread | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<ChatThread>(
      `SELECT id, userId, title, createdAt, updatedAt, lastMessageAt, messageCount
       FROM chat_threads 
       WHERE id = ?`,
      [threadId]
    );

    return row || null;
  }

  async deleteThread(threadId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM chat_threads WHERE id = ?', [threadId]);
  }

  // Message operations
  async saveMessage(message: LocalChatMessage): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO chat_messages 
       (id, localId, chatId, role, content, timestamp, metadata, synced, optimistic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.localId,
        message.chatId,
        message.role,
        message.content,
        message.timestamp,
        message.metadata ? JSON.stringify(message.metadata) : null,
        message.synced ? 1 : 0,
        message.optimistic ? 1 : 0,
      ]
    );
  }

  async getMessages(chatId: string, limit = 100): Promise<LocalChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      `SELECT id, localId, chatId, role, content, timestamp, metadata, synced, optimistic
       FROM chat_messages 
       WHERE chatId = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [chatId, limit]
    );

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      synced: row.synced === 1,
      optimistic: row.optimistic === 1,
    }));
  }

  async getMessage(messageId: string): Promise<LocalChatMessage | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      `SELECT id, localId, chatId, role, content, timestamp, metadata, synced, optimistic
       FROM chat_messages 
       WHERE id = ? OR localId = ?`,
      [messageId, messageId]
    );

    if (!row) return null;

    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      synced: row.synced === 1,
      optimistic: row.optimistic === 1,
    };
  }

  async getUnsyncedMessages(): Promise<LocalChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      `SELECT id, localId, chatId, role, content, timestamp, metadata, synced, optimistic
       FROM chat_messages 
       WHERE synced = 0
       ORDER BY timestamp ASC`
    );

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      synced: false,
      optimistic: row.optimistic === 1,
    }));
  }

  async markMessageAsSynced(localId: string, serverId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE chat_messages 
       SET id = ?, synced = 1, optimistic = 0
       WHERE localId = ?`,
      [serverId, localId]
    );
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'DELETE FROM chat_messages WHERE id = ? OR localId = ?',
      [messageId, messageId]
    );
  }

  // Sync operations
  async getUnsyncedCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM chat_messages WHERE synced = 0'
    );

    return result?.count || 0;
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM chat_messages;
      DELETE FROM chat_threads;
    `);

    logger.info('All local data cleared');
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      logger.info('Database closed');
    }
  }
}

export const databaseService = new DatabaseService();
