/**
 * Solace AI - Mood Persistence Service
 * Phase 5: Home Dashboard & Mood Check-in
 *
 * Scopes mood logs per authenticated user using AsyncStorage with key:
 * `@solace_mood_entries_${userId}`
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MoodEntry,
  MoodType,
  MOOD_OPTIONS,
  WellnessJourneySummary,
  DayActivity,
} from '@/types/mood';

const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

function getStorageKey(userId: string): string {
  const safeId = (userId || 'guest_user').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `@solace_mood_entries_${safeId}`;
}

/**
 * Format Date to YYYY-MM-DD local calendar date string
 */
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const moodService = {
  /**
   * Save a new mood check-in entry for a specific user.
   */
  async saveMoodEntry(
    userId: string,
    entryData: Omit<MoodEntry, 'id' | 'createdAt'>
  ): Promise<MoodEntry> {
    if (!userId || !userId.trim()) {
      userId = 'guest_user';
    }

    if (!entryData.mood) {
      throw new Error('A primary mood must be selected before saving.');
    }

    const key = getStorageKey(userId);
    const existing = await this.getMoodEntries(userId);

    const now = new Date();
    const newEntry: MoodEntry = {
      ...entryData,
      id: `mood_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      createdAt: now.toISOString(),
    };

    // Prepend to maintain newest-first order
    const updatedEntries = [newEntry, ...existing];

    try {
      await storage.setItem(key, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('[moodService] Failed to persist mood entry:', error);
      throw new Error('Unable to save mood check-in to device storage.');
    }

    return newEntry;
  },

  /**
   * Retrieve all mood check-in entries for a specific user, sorted newest first.
   */
  async getMoodEntries(userId: string): Promise<MoodEntry[]> {
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
        console.warn('[moodService] Stored mood data corrupted, resetting to empty array');
        return [];
      }

      // Filter invalid items and sort by createdAt descending
      return parsed
        .filter((item): item is MoodEntry => Boolean(item && item.id && item.mood))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('[moodService] Error reading mood entries:', error);
      return [];
    }
  },

  /**
   * Retrieve the most recent entries for dashboard display.
   */
  async getRecentMoodEntries(userId: string, limit: number = 5): Promise<MoodEntry[]> {
    const all = await this.getMoodEntries(userId);
    return all.slice(0, limit);
  },

  /**
   * Retrieve the latest mood entry, or null if no entries exist.
   */
  async getLatestMoodEntry(userId: string): Promise<MoodEntry | null> {
    const entries = await this.getMoodEntries(userId);
    return entries.length > 0 ? entries[0] : null;
  },

  /**
   * Delete a single mood entry by ID.
   */
  async deleteMoodEntry(userId: string, entryId: string): Promise<boolean> {
    const entries = await this.getMoodEntries(userId);
    const filtered = entries.filter((e) => e.id !== entryId);

    if (filtered.length === entries.length) {
      return false;
    }

    const key = getStorageKey(userId);
    try {
      await storage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('[moodService] Failed to delete entry:', error);
      return false;
    }
  },

  /**
   * Clear all mood entries for a specific user.
   */
  async clearUserMoodEntries(userId: string): Promise<void> {
    const key = getStorageKey(userId);
    try {
      await storage.removeItem(key);
    } catch (error) {
      console.warn('[moodService] Failed to clear user mood entries:', error);
    }
  },

  /**
   * Compute authentic wellness journey summary and streak strictly from real records.
   * Zero fabrication: returns 0 streak if no logs exist.
   */
  async getWellnessJourneySummary(userId: string): Promise<WellnessJourneySummary> {
    const entries = await this.getMoodEntries(userId);

    if (entries.length === 0) {
      // Return empty summary with real current week days
      const weekTimeline = this.generateCurrentWeekTimeline([]);
      return {
        streakDays: 0,
        totalEntries: 0,
        predominantMood: undefined,
        predominantEmoji: undefined,
        weekTimeline,
      };
    }

    // 1. Calculate active consecutive streak
    const entryDates = new Set<string>();
    entries.forEach((e) => {
      const d = new Date(e.createdAt);
      entryDates.add(toLocalDateString(d));
    });

    const now = new Date();
    const todayStr = toLocalDateString(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    let streakDays = 0;

    // Check if streak is active today or yesterday
    let checkDate: Date | null = null;
    if (entryDates.has(todayStr)) {
      checkDate = new Date(now);
    } else if (entryDates.has(yesterdayStr)) {
      checkDate = new Date(yesterday);
    }

    if (checkDate) {
      while (true) {
        const dateStr = toLocalDateString(checkDate);
        if (entryDates.has(dateStr)) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 2. Calculate predominant mood
    const moodCounts: Record<string, number> = {};
    entries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    let topMoodType: MoodType = entries[0].mood;
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topMoodType = m as MoodType;
      }
    });

    const matchedOption = MOOD_OPTIONS.find((o) => o.type === topMoodType);
    const predominantMood = matchedOption ? matchedOption.label : entries[0].moodLabel;
    const predominantEmoji = matchedOption ? matchedOption.emoji : entries[0].emoji;

    // 3. Generate week timeline (Mon - Sun)
    const weekTimeline = this.generateCurrentWeekTimeline(entries);

    return {
      streakDays,
      currentStreak: streakDays,
      totalEntries: entries.length,
      predominantMood,
      dominantMood: predominantMood,
      predominantEmoji,
      weekTimeline,
    };
  },

  /**
   * Helper to generate 7-day timeline for current calendar week (Monday to Sunday).
   */
  generateCurrentWeekTimeline(entries: MoodEntry[]): DayActivity[] {
    const now = new Date();
    const todayStr = toLocalDateString(now);

    // Find Monday of the current week
    // getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const currentDayOfWeek = now.getDay();
    // Days since Monday: if Sunday (0), distance is 6; otherwise currentDayOfWeek - 1
    const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(monday.getDate() - distanceToMonday);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const timeline: DayActivity[] = [];

    // Map of dateString -> entries on that date
    const entriesByDate: Record<string, MoodEntry[]> = {};
    entries.forEach((e) => {
      const d = toLocalDateString(new Date(e.createdAt));
      if (!entriesByDate[d]) {
        entriesByDate[d] = [];
      }
      entriesByDate[d].push(e);
    });

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateString = toLocalDateString(date);
      const dayEntries = entriesByDate[dateString] || [];
      const hasEntry = dayEntries.length > 0;

      let primaryMood: MoodType | undefined = undefined;
      let primaryEmoji: string | undefined = undefined;

      if (hasEntry) {
        primaryMood = dayEntries[0].mood;
        primaryEmoji = dayEntries[0].emoji;
      }

      timeline.push({
        dayLetter: dayLabels[i],
        dayName: dayNames[i],
        dateString,
        isToday: dateString === todayStr,
        hasEntry,
        entryCount: dayEntries.length,
        primaryMood,
        primaryEmoji,
      });
    }

    return timeline;
  },
};

