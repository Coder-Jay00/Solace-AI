/**
 * Solace AI - Breathing Session Persistence Service
 * Phase 7.5: Breathing Exercise Integration Across Solace
 *
 * Scopes breathing records per authenticated user using AsyncStorage with key:
 * `@solace_breathing_sessions_${userId}`
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BreathingSession, BreathingStats } from '@/types/breathingSession';

const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

function getStorageKey(userId: string): string {
  const safeId = (userId || 'guest_user').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `@solace_breathing_sessions_${safeId}`;
}

export const breathingService = {
  /**
   * Save a completed breathing session for a specific user.
   * Only completed sessions with positive duration are recorded.
   */
  async saveBreathingSession(
    userId: string,
    sessionData: Omit<BreathingSession, 'id' | 'completedAt' | 'userId'>
  ): Promise<BreathingSession | null> {
    if (!userId || !userId.trim()) {
      userId = 'guest_user';
    }

    // Do not record incomplete or empty sessions
    if (!sessionData.isCompleted || sessionData.completedDurationSeconds <= 0) {
      return null;
    }

    const key = getStorageKey(userId);
    const existing = await this.getBreathingSessions(userId);

    const now = new Date().toISOString();
    const newSession: BreathingSession = {
      ...sessionData,
      id: `breath_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      completedAt: now,
    };

    // Prepend to maintain newest-first order
    const updated = [newSession, ...existing];

    try {
      await storage.setItem(key, JSON.stringify(updated));
      return newSession;
    } catch (error) {
      console.error('[breathingService] Failed to persist breathing session:', error);
      throw new Error('Unable to save breathing session to storage.');
    }
  },

  /**
   * Retrieve all breathing sessions for a specific user, sorted newest first.
   */
  async getBreathingSessions(userId: string): Promise<BreathingSession[]> {
    if (!userId || !userId.trim()) {
      userId = 'guest_user';
    }

    const key = getStorageKey(userId);
    try {
      const rawData = await storage.getItem(key);
      if (!rawData) {
        return [];
      }

      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed)) {
        console.warn('[breathingService] Stored breathing session data corrupted, returning []');
        return [];
      }

      return parsed
        .filter((item): item is BreathingSession => Boolean(item && item.id && item.isCompleted))
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    } catch (error) {
      console.warn('[breathingService] Error reading breathing sessions, returning empty list:', error);
      return [];
    }
  },

  /**
   * Compute aggregated statistics from stored breathing sessions.
   * Zero fabrication: returns 0 if no sessions exist.
   */
  async getBreathingStats(userId: string): Promise<BreathingStats> {
    const sessions = await this.getBreathingSessions(userId);

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalSessionsCompleted: 0,
        totalDurationSeconds: 0,
        totalDurationMinutes: 0,
        totalMinutesBreathed: 0,
        totalCycles: 0,
        lastSession: null,
        recentSessions: [],
      };
    }

    const totalDurationSeconds = sessions.reduce((acc, s) => acc + (s.completedDurationSeconds || 0), 0);
    const totalCycles = sessions.reduce((acc, s) => acc + (s.completedCycles || 0), 0);
    const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

    return {
      totalSessions: sessions.length,
      totalSessionsCompleted: sessions.length,
      totalDurationSeconds,
      totalDurationMinutes,
      totalMinutesBreathed: totalDurationMinutes,
      totalCycles,
      lastSession: sessions[0] || null,
      recentSessions: sessions.slice(0, 5),
    };
  },

  /**
   * Clear all breathing sessions for a specific user.
   */
  async clearUserBreathingSessions(userId: string): Promise<void> {
    const key = getStorageKey(userId);
    try {
      await storage.removeItem(key);
    } catch (error) {
      console.warn('[breathingService] Failed to clear breathing sessions:', error);
    }
  },
};
