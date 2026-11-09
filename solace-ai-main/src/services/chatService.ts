/**
 * Solace AI - Chat & Conversation Persistence Service
 * Phase 6: AI Companion Chat Interface & Chat History
 *
 * Scopes conversation dialogues per authenticated user using AsyncStorage with key:
 * `@solace_conversations_${userId}`
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, ChatMessage } from '@/types/chat';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getStorageKey(userId: string): string {
  const safeId = (userId || 'guest_user').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `@solace_conversations_${safeId}`;
}

export const chatService = {
  /**
   * Retrieve all conversations for a specific user, sorted most recently updated first.
   * Hydrates from Supabase cloud database when authenticated, while falling back seamlessly to local storage.
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!userId || !userId.trim()) {
      userId = 'guest_user';
    }

    const key = getStorageKey(userId);
    let localConvs: Conversation[] = [];

    try {
      const rawData = await storage.getItem(key);
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
          localConvs = parsed
            .filter((item): item is Conversation => Boolean(item && item.id && item.userId))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
      }
    } catch (error) {
      console.warn('[chatService] Error parsing local conversations:', error);
    }

    // Hydrate from Supabase cloud backend if configured and user is authenticated
    if (isSupabaseConfigured() && supabase && userId !== 'guest_user') {
      try {
        const { data: remoteConvs, error: remoteErr } = await supabase
          .from('conversations')
          .select('id, user_id, title, last_message_text, created_at, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!remoteErr && Array.isArray(remoteConvs) && remoteConvs.length > 0) {
          const localMap = new Map(localConvs.map((c) => [c.id, c]));
          const merged: Conversation[] = [];

          for (const r of remoteConvs) {
            const existing = localMap.get(r.id);
            merged.push({
              id: r.id,
              userId: r.user_id,
              title: r.title || 'Sanctuary Reflection',
              lastMessageText: r.last_message_text || existing?.lastMessageText || '',
              createdAt: r.created_at,
              updatedAt: r.updated_at,
              messages: existing?.messages || [],
            });
            localMap.delete(r.id);
          }

          // Retain any pending local-only conversations
          for (const pending of localMap.values()) {
            merged.push(pending);
          }

          merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          await storage.setItem(key, JSON.stringify(merged));
          return merged;
        }
      } catch (remoteErr) {
        console.warn('[chatService] Cloud conversations sync fallback to cache:', remoteErr);
      }
    }

    return localConvs;
  },

  /**
   * Retrieve a specific conversation by ID with messages sorted chronologically.
   * If messages are empty or cloud sync is available, queries public.chat_messages.
   */
  async getConversationById(userId: string, conversationId: string): Promise<Conversation | null> {
    const list = await this.getConversations(userId);
    let found = list.find((c) => c.id === conversationId);
    if (!found) {
      // If conversation is from Supabase but not yet in local cache, fetch metadata directly
      if (
        isSupabaseConfigured() &&
        supabase &&
        userId !== 'guest_user' &&
        UUID_REGEX.test(conversationId)
      ) {
        try {
          const { data: remoteConv } = await supabase
            .from('conversations')
            .select('id, user_id, title, last_message_text, created_at, updated_at')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .maybeSingle();

          if (remoteConv) {
            found = {
              id: remoteConv.id,
              userId: remoteConv.user_id,
              title: remoteConv.title || 'Sanctuary Reflection',
              lastMessageText: remoteConv.last_message_text || '',
              createdAt: remoteConv.created_at,
              updatedAt: remoteConv.updated_at,
              messages: [],
            };
          }
        } catch (fetchErr) {
          console.warn('[chatService] Direct conversation fetch fallback note:', fetchErr);
        }
      }
      if (!found) {
        return null;
      }
    }

    // If conversation is from Supabase or has no messages, attempt to hydrate from cloud
    if (
      isSupabaseConfigured() &&
      supabase &&
      userId !== 'guest_user' &&
      UUID_REGEX.test(conversationId)
    ) {
      try {
        const { data: remoteMsgs, error: msgErr } = await supabase
          .from('chat_messages')
          .select('id, conversation_id, sender, text, is_crisis, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!msgErr && Array.isArray(remoteMsgs) && remoteMsgs.length > 0) {
          const mapped: ChatMessage[] = remoteMsgs.map((m) => ({
            id: m.id,
            conversationId: m.conversation_id,
            sender: m.sender as 'user' | 'assistant',
            text: m.text,
            isCrisis: Boolean(m.is_crisis),
            createdAt: m.created_at,
          }));

          found = {
            ...found,
            messages: mapped,
          };

          // Cache back to local storage
          const key = getStorageKey(userId);
          const updatedList = list.map((c) => (c.id === conversationId ? found! : c));
          await storage.setItem(key, JSON.stringify(updatedList));
        }
      } catch (msgSyncErr) {
        console.warn('[chatService] Cloud messages sync fallback to cache:', msgSyncErr);
      }
    }

    // Ensure messages are sorted chronologically
    const sortedMessages = [...(found.messages || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      ...found,
      messages: sortedMessages,
    };
  },

  /**
   * Create a new conversation session.
   */
  async createConversation(userId: string, initialTitle: string = 'New Reflection'): Promise<Conversation> {
    if (!userId || !userId.trim()) {
      userId = 'guest_user';
    }

    const key = getStorageKey(userId);
    const existing = await this.getConversations(userId);

    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      title: initialTitle,
      lastMessageText: '',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    const updated = [newConv, ...existing];
    try {
      await storage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('[chatService] Failed to persist new conversation:', error);
      throw new Error('Unable to create conversation in device storage.');
    }

    return newConv;
  },

  /**
   * Add a message (from user or assistant) to a conversation.
   * Auto-titles the conversation from the first user message if still untitled.
   */
  async addMessageToConversation(
    userId: string,
    conversationId: string,
    sender: 'user' | 'assistant',
    text: string,
    isCrisis: boolean = false
  ): Promise<{ conversation: Conversation; message: ChatMessage }> {
    if (!userId || !userId.trim()) {
      userId = 'guest_user';
    }

    if (!text || !text.trim()) {
      throw new Error('Message text cannot be empty.');
    }

    const key = getStorageKey(userId);
    const conversations = await this.getConversations(userId);
    let targetIndex = conversations.findIndex((c) => c.id === conversationId);

    let targetConv: Conversation;
    const now = new Date().toISOString();

    if (targetIndex === -1) {
      // Create if it didn't exist
      targetConv = {
        id: conversationId,
        userId,
        title: 'New Reflection',
        lastMessageText: '',
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      conversations.unshift(targetConv);
      targetIndex = 0;
    } else {
      targetConv = conversations[targetIndex];
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      conversationId: targetConv.id,
      sender,
      text: text.trim(),
      isCrisis,
      createdAt: now,
    };

    // Update title from first user message only if untitled or default
    let updatedTitle = targetConv.title;
    if (
      sender === 'user' &&
      (!targetConv.title || targetConv.title === 'New Reflection')
    ) {
      const cleanText = text.trim().replace(/\n/g, ' ');
      updatedTitle = cleanText.length > 36 ? `${cleanText.substring(0, 36)}...` : cleanText;
    }

    const updatedMessages = [...(targetConv.messages || []), newMessage];

    const updatedConv: Conversation = {
      ...targetConv,
      title: updatedTitle,
      lastMessageText: newMessage.text,
      updatedAt: now,
      messages: updatedMessages,
    };

    // Replace and re-sort (so updated conversation moves to top)
    conversations[targetIndex] = updatedConv;
    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    try {
      await storage.setItem(key, JSON.stringify(conversations));
    } catch (error) {
      console.error('[chatService] Failed to persist message:', error);
      throw new Error('Unable to save message to storage.');
    }

    return { conversation: updatedConv, message: newMessage };
  },

  /**
   * Rename an existing conversation.
   */
  async renameConversation(userId: string, conversationId: string, newTitle: string): Promise<boolean> {
    if (!newTitle || !newTitle.trim()) return false;

    const key = getStorageKey(userId);
    const conversations = await this.getConversations(userId);
    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return false;

    target.title = newTitle.trim();
    target.updatedAt = new Date().toISOString();

    try {
      await storage.setItem(key, JSON.stringify(conversations));
      return true;
    } catch (error) {
      console.error('[chatService] Failed to rename conversation:', error);
      return false;
    }
  },

  /**
   * Delete a single conversation by ID.
   */
  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    const key = getStorageKey(userId);
    const conversations = await this.getConversations(userId);
    const filtered = conversations.filter((c) => c.id !== conversationId);

    if (filtered.length === conversations.length) {
      return false;
    }

    try {
      await storage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('[chatService] Failed to delete conversation:', error);
      return false;
    }
  },

  /**
   * Clear all conversations for a user.
   */
  async clearUserConversations(userId: string): Promise<void> {
    const key = getStorageKey(userId);
    try {
      await storage.removeItem(key);
    } catch (error) {
      console.warn('[chatService] Failed to clear user conversations:', error);
    }
  },

  /**
   * Search conversations by title or message text.
   */
  async searchConversations(userId: string, query: string): Promise<Conversation[]> {
    const list = await this.getConversations(userId);
    if (!query || !query.trim()) {
      return list;
    }

    const q = query.trim().toLowerCase();
    return list.filter((conv) => {
      if (conv.title.toLowerCase().includes(q)) return true;
      if (conv.lastMessageText.toLowerCase().includes(q)) return true;
      return conv.messages.some((m) => m.text.toLowerCase().includes(q));
    });
  },
};
