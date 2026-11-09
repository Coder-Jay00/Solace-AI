/**
 * Solace AI - Supabase Cloud Synchronization Service
 * Phase 8: Supabase Cloud Backend Integration
 *
 * Provides bidirectional sync helpers between local AsyncStorage data and
 * Supabase PostgreSQL tables while strictly respecting Row-Level Security (RLS).
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { moodService } from './moodService';
import { breathingService } from './breathingService';
import { notificationService } from './notificationService';
import { MoodEntry } from '@/types/mood';
import { BreathingSession } from '@/types/breathingSession';

export interface SyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  lastSyncTime?: string;
  error?: string;
}

export const supabaseSyncService = {
  /**
   * Checks whether Supabase is configured and reachable.
   * Never throws; returns connection diagnostics safely.
   */
  async checkConnection(): Promise<{ connected: boolean; message: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        connected: false,
        message: 'Supabase credentials are not configured in .env',
      };
    }

    try {
      // Test read against public profiles table
      const { error } = await supabase.from('profiles').select('id').limit(1);

      if (error) {
        // Check if table does not exist (schema not yet run)
        if (error.code === '42P01' || error.message.includes('relation "public.profiles" does not exist')) {
          return {
            connected: false,
            message: 'Database reachable, but schema has not been executed yet. Run supabase/schema.sql in the SQL Editor.',
          };
        }
        return {
          connected: false,
          message: error.message,
        };
      }

      return {
        connected: true,
        message: 'Connected to Supabase PostgreSQL database',
      };
    } catch (err: any) {
      return {
        connected: false,
        message: err?.message || 'Connection failed',
      };
    }
  },

  /**
   * Pushes local mood entries to Supabase cloud.
   */
  async syncMoodEntries(userId: string): Promise<{ synced: number; error?: string }> {
    if (!isSupabaseConfigured() || !supabase || !userId || userId === 'guest_user') {
      return { synced: 0 };
    }

    try {
      const localEntries = await moodService.getMoodEntries(userId);
      if (localEntries.length === 0) return { synced: 0 };

      // Map to Supabase mood_entries schema
      const rows = localEntries.map((e: MoodEntry) => ({
        user_id: userId,
        mood: e.mood,
        mood_label: e.moodLabel || '',
        emoji: e.emoji || '🌿',
        energy_level: e.energyLevel,
        energy_label: e.energyLabel || '',
        note: e.note || '',
        nuance_tags: e.nuanceTags || [],
        context_tags: e.contextTags || [],
        created_at: e.createdAt,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('mood_entries').upsert(rows, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.warn('[SyncService] Failed syncing mood entries:', error.message);
        return { synced: 0, error: error.message };
      }

      return { synced: rows.length };
    } catch (err: any) {
      console.warn('[SyncService] Error in syncMoodEntries:', err);
      return { synced: 0, error: err?.message };
    }
  },

  /**
   * Pushes local breathing sessions to Supabase cloud.
   */
  async syncBreathingSessions(userId: string): Promise<{ synced: number; error?: string }> {
    if (!isSupabaseConfigured() || !supabase || !userId || userId === 'guest_user') {
      return { synced: 0 };
    }

    try {
      const localSessions = await breathingService.getBreathingSessions(userId);
      if (localSessions.length === 0) return { synced: 0 };

      const rows = localSessions.map((s: BreathingSession) => ({
        user_id: userId,
        pattern_id: s.patternId,
        pattern_name: s.patternName,
        inhale: s.inhale,
        hold_in: s.holdIn,
        exhale: s.exhale,
        hold_out: s.holdOut,
        target_duration_minutes: s.targetDurationMinutes,
        completed_duration_seconds: s.completedDurationSeconds,
        completed_cycles: s.completedCycles,
        is_completed: s.isCompleted,
        completed_at: s.completedAt,
        created_at: s.completedAt,
      }));

      const { error } = await supabase.from('breathing_sessions').upsert(rows, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.warn('[SyncService] Failed syncing breathing sessions:', error.message);
        return { synced: 0, error: error.message };
      }

      return { synced: rows.length };
    } catch (err: any) {
      console.warn('[SyncService] Error in syncBreathingSessions:', err);
      return { synced: 0, error: err?.message };
    }
  },

  /**
   * Syncs user notification preferences to Supabase cloud.
   */
  async syncPreferences(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase || !userId || userId === 'guest_user') {
      return false;
    }

    try {
      const prefs = await notificationService.loadPreferences(userId);
      const row = {
        user_id: userId,
        master_enabled: prefs.masterEnabled,
        mood_reminder: prefs.moodReminder,
        breathing_reminder: prefs.breathingReminder,
        intention_reminder: prefs.intentionReminder,
        companion_reminder: prefs.companionReminder,
        quiet_hours: prefs.quietHours,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_preferences').upsert(row, {
        onConflict: 'user_id',
      });

      if (error) {
        console.warn('[SyncService] Failed syncing preferences:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[SyncService] Error in syncPreferences:', err);
      return false;
    }
  },
};
