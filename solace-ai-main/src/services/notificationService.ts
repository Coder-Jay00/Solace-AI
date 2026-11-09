/**
 * Solace AI - Local Notification Service
 * Phase 7.6–7.8: Complete Local Notifications Implementation
 *
 * Provides dedicated scheduling, quiet hours calculation, Android channels,
 * permission management, and tap navigation routing for Solace AI reminders.
 * Scoped strictly to local notifications (no external backend/push).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  NotificationCategory,
  NotificationPermissionStatus,
  NotificationPreferences,
  QuietHoursPreference,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CONFIGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  validateNotificationPreferences,
} from '@/types/notification';

const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

// Configure default notification handler for foreground presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Derives a safe user-scoped storage key for notification preferences
 */
function getStorageKey(userId?: string): string {
  const safeId = (userId || 'guest_user').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `@solace_notification_preferences_${safeId}`;
}

/**
 * Checks whether a given hour:minute falls within the quiet hours window.
 * Properly handles both same-day windows (e.g. 13:00 - 15:00) and
 * midnight-spanning windows (e.g. 22:00 - 07:00).
 */
export function isTimeInQuietHours(
  hour: number,
  minute: number,
  quietHours: QuietHoursPreference
): boolean {
  if (!quietHours.enabled) {
    return false;
  }

  const timeMin = hour * 60 + minute;
  const startMin = quietHours.startHour * 60 + quietHours.startMinute;
  const endMin = quietHours.endHour * 60 + quietHours.endMinute;

  if (startMin === endMin) {
    return false;
  }

  if (startMin < endMin) {
    // Same-day window (e.g. 13:00 -> 15:00)
    return timeMin >= startMin && timeMin < endMin;
  } else {
    // Overnight / spans midnight (e.g. 22:00 -> 07:00)
    return timeMin >= startMin || timeMin < endMin;
  }
}

/**
 * Computes the effective firing time for a reminder.
 * If the configured time falls inside quiet hours, shifts to the end of the quiet period.
 */
export function computeEffectiveTime(
  hour: number,
  minute: number,
  quietHours: QuietHoursPreference
): { hour: number; minute: number; isShifted: boolean } {
  if (isTimeInQuietHours(hour, minute, quietHours)) {
    return {
      hour: quietHours.endHour,
      minute: quietHours.endMinute,
      isShifted: true,
    };
  }
  return {
    hour,
    minute,
    isShifted: false,
  };
}

export const notificationService = {
  /**
   * Initializes notification channels on Android.
   * Safe to call repeatedly on app launch.
   */
  async initChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    for (const key of Object.keys(NOTIFICATION_CHANNELS) as NotificationCategory[]) {
      const channel = NOTIFICATION_CHANNELS[key];
      try {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          description: channel.description,
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#A85F72',
          enableLights: true,
          enableVibrate: true,
        });
      } catch (err: any) {
        // In Expo Go on Android, custom channel management is scoped to the host runner.
        // Local notifications schedule normally and use the default Android notification channel.
        console.log(`[NotificationService] Android channel '${channel.id}' initialization note:`, err?.message || err);
      }
    }
  },

  /**
   * Reads current notification permission status.
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted || settings.status === 'granted') {
        return 'granted';
      }
      if (settings.status === 'denied') {
        return 'denied';
      }
      return 'undetermined';
    } catch (err) {
      console.warn('[NotificationService] Failed to read permissions:', err);
      return 'undetermined';
    }
  },

  /**
   * Requests notification permissions from the OS.
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      const response = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });

      if (response.granted || response.status === 'granted') {
        return 'granted';
      }
      if (response.status === 'denied') {
        return 'denied';
      }
      return 'undetermined';
    } catch (err) {
      console.warn('[NotificationService] Failed to request permissions:', err);
      return 'denied';
    }
  },

  /**
   * Loads saved reminder preferences for a user, falling back to safe defaults.
   */
  async loadPreferences(userId?: string): Promise<NotificationPreferences> {
    try {
      const key = getStorageKey(userId);
      const raw = await storage.getItem(key);
      if (!raw) {
        return { ...DEFAULT_NOTIFICATION_PREFERENCES };
      }
      const parsed = JSON.parse(raw);
      return validateNotificationPreferences(parsed);
    } catch (err) {
      console.warn('[NotificationService] Failed to load preferences, using fallback:', err);
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
  },

  /**
   * Persists reminder preferences for a user.
   */
  async savePreferences(
    userId: string | undefined,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    const validated = validateNotificationPreferences(preferences);
    validated.updatedAt = new Date().toISOString();
    try {
      const key = getStorageKey(userId);
      await storage.setItem(key, JSON.stringify(validated));
    } catch (err) {
      console.warn('[NotificationService] Failed to save preferences:', err);
    }
    return validated;
  },

  /**
   * Clears reminder preferences for a user from storage.
   */
  async clearPreferences(userId?: string): Promise<void> {
    try {
      const key = getStorageKey(userId);
      await storage.removeItem(key);
    } catch (err) {
      console.warn('[NotificationService] Failed to clear preferences:', err);
    }
  },

  /**
   * Cancels a specific scheduled notification by ID.
   */
  async cancelNotificationById(notificationId: string): Promise<void> {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn(`[NotificationService] Failed to cancel notification ${notificationId}:`, err);
    }
  },

  /**
   * Cancels scheduled reminders for a specific category based on saved IDs.
   */
  async cancelCategoryReminder(
    category: NotificationCategory,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      if (category === 'mood' && preferences.moodReminder.notificationId) {
        await this.cancelNotificationById(preferences.moodReminder.notificationId);
      } else if (category === 'intention' && preferences.intentionReminder.notificationId) {
        await this.cancelNotificationById(preferences.intentionReminder.notificationId);
      } else if (category === 'breathing') {
        if (preferences.breathingReminder.notificationId) {
          await this.cancelNotificationById(preferences.breathingReminder.notificationId);
        }
        if (preferences.breathingReminder.notificationIds?.length) {
          for (const id of preferences.breathingReminder.notificationIds) {
            await this.cancelNotificationById(id);
          }
        }
      } else if (category === 'companion') {
        if (preferences.companionReminder.notificationId) {
          await this.cancelNotificationById(preferences.companionReminder.notificationId);
        }
        if (preferences.companionReminder.notificationIds?.length) {
          for (const id of preferences.companionReminder.notificationIds) {
            await this.cancelNotificationById(id);
          }
        }
      }
    } catch (err) {
      console.warn(`[NotificationService] Error cancelling category ${category}:`, err);
    }
  },

  /**
   * Cancels all scheduled notifications owned by Solace AI.
   * Protects any notifications that may belong to other libraries.
   */
  async cancelAllSolaceReminders(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const item of scheduled) {
        const data = item.content?.data as any;
        const identifier = item.identifier || '';
        if (data?.solaceAi === true || identifier.startsWith('solace_')) {
          await Notifications.cancelScheduledNotificationAsync(item.identifier);
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Failed to cancel all Solace reminders:', err);
    }
  },

  /**
   * Schedules a daily reminder (used by Mood Check-in & Daily Intention).
   */
  async scheduleDailyReminder(
    category: 'mood' | 'intention',
    hour: number,
    minute: number,
    quietHours: QuietHoursPreference
  ): Promise<string> {
    const config = NOTIFICATION_CONFIGS[category];
    const { hour: effHour, minute: effMinute } = computeEffectiveTime(hour, minute, quietHours);

    const identifier = `solace_${category}_${effHour}_${effMinute}`;

    const scheduledId = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: config.title,
        body: config.body,
        sound: 'default',
        data: {
          category,
          destinationRoute: config.destinationRoute,
          solaceAi: true,
          configuredTime: `${hour}:${minute}`,
          effectiveTime: `${effHour}:${effMinute}`,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: effHour,
        minute: effMinute,
        channelId: config.channelId,
      },
    });

    return scheduledId;
  },

  /**
   * Schedules a reminder on selected weekdays (used by Breathing Practice & Companion).
   */
  async scheduleWeekdayReminder(
    category: 'breathing' | 'companion',
    hour: number,
    minute: number,
    selectedDays: number[],
    quietHours: QuietHoursPreference
  ): Promise<string[]> {
    const config = NOTIFICATION_CONFIGS[category];
    const { hour: effHour, minute: effMinute } = computeEffectiveTime(hour, minute, quietHours);
    const scheduledIds: string[] = [];

    const daysToSchedule = selectedDays.length > 0 ? selectedDays : [2, 3, 4, 5, 6];

    for (const day of daysToSchedule) {
      const identifier = `solace_${category}_d${day}_${effHour}_${effMinute}`;

      try {
        const id = await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: config.title,
            body: config.body,
            sound: 'default',
            data: {
              category,
              destinationRoute: config.destinationRoute,
              solaceAi: true,
              weekday: day,
              configuredTime: `${hour}:${minute}`,
              effectiveTime: `${effHour}:${effMinute}`,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day,
            hour: effHour,
            minute: effMinute,
            channelId: config.channelId,
          },
        });
        scheduledIds.push(id);
      } catch (err) {
        console.warn(`[NotificationService] Failed to schedule weekday ${day} for ${category}:`, err);
      }
    }

    return scheduledIds;
  },

  /**
   * Reconciles scheduled OS notifications with stored preferences.
   * Cancels obsolete or duplicate schedules and creates required ones.
   */
  async reconcileSchedules(userId?: string): Promise<NotificationPreferences> {
    const preferences = await this.loadPreferences(userId);

    // If master is disabled, ensure all Solace reminders are cancelled
    if (!preferences.masterEnabled) {
      await this.cancelAllSolaceReminders();
      const cleaned: NotificationPreferences = {
        ...preferences,
        moodReminder: { ...preferences.moodReminder, notificationId: undefined },
        breathingReminder: {
          ...preferences.breathingReminder,
          notificationId: undefined,
          notificationIds: undefined,
        },
        intentionReminder: { ...preferences.intentionReminder, notificationId: undefined },
        companionReminder: {
          ...preferences.companionReminder,
          notificationId: undefined,
          notificationIds: undefined,
        },
      };
      await this.savePreferences(userId, cleaned);
      return cleaned;
    }

    // Check OS permissions
    const status = await this.getPermissionStatus();
    if (status !== 'granted') {
      // Permission not granted; cannot schedule OS notifications
      await this.cancelAllSolaceReminders();
      return preferences;
    }

    // Cancel existing Solace schedules to avoid duplicates
    await this.cancelAllSolaceReminders();

    const updated: NotificationPreferences = { ...preferences };

    // 1. Mood Check-in
    if (updated.moodReminder.enabled) {
      try {
        const id = await this.scheduleDailyReminder(
          'mood',
          updated.moodReminder.hour,
          updated.moodReminder.minute,
          updated.quietHours
        );
        updated.moodReminder.notificationId = id;
      } catch (err) {
        console.warn('[NotificationService] Reconcile mood schedule error:', err);
      }
    } else {
      updated.moodReminder.notificationId = undefined;
    }

    // 2. Breathing Practice
    if (updated.breathingReminder.enabled) {
      try {
        const ids = await this.scheduleWeekdayReminder(
          'breathing',
          updated.breathingReminder.hour,
          updated.breathingReminder.minute,
          updated.breathingReminder.selectedDays,
          updated.quietHours
        );
        updated.breathingReminder.notificationIds = ids;
        updated.breathingReminder.notificationId = ids[0];
      } catch (err) {
        console.warn('[NotificationService] Reconcile breathing schedule error:', err);
      }
    } else {
      updated.breathingReminder.notificationId = undefined;
      updated.breathingReminder.notificationIds = undefined;
    }

    // 3. Daily Intention
    if (updated.intentionReminder.enabled) {
      try {
        const id = await this.scheduleDailyReminder(
          'intention',
          updated.intentionReminder.hour,
          updated.intentionReminder.minute,
          updated.quietHours
        );
        updated.intentionReminder.notificationId = id;
      } catch (err) {
        console.warn('[NotificationService] Reconcile intention schedule error:', err);
      }
    } else {
      updated.intentionReminder.notificationId = undefined;
    }

    // 4. Companion
    if (updated.companionReminder.enabled) {
      try {
        const ids = await this.scheduleWeekdayReminder(
          'companion',
          updated.companionReminder.hour,
          updated.companionReminder.minute,
          updated.companionReminder.selectedDays,
          updated.quietHours
        );
        updated.companionReminder.notificationIds = ids;
        updated.companionReminder.notificationId = ids[0];
      } catch (err) {
        console.warn('[NotificationService] Reconcile companion schedule error:', err);
      }
    } else {
      updated.companionReminder.notificationId = undefined;
      updated.companionReminder.notificationIds = undefined;
    }

    await this.savePreferences(userId, updated);
    return updated;
  },

  /**
   * Resolves the navigation route when a notification is tapped.
   */
  getDestinationForResponse(
    response: Notifications.NotificationResponse | null
  ): string | null {
    if (!response) return null;

    const data = response.notification?.request?.content?.data as any;
    if (data?.destinationRoute && typeof data.destinationRoute === 'string') {
      return data.destinationRoute;
    }

    // Fallback based on category
    const category = data?.category as NotificationCategory | undefined;
    if (category && NOTIFICATION_CONFIGS[category]) {
      return NOTIFICATION_CONFIGS[category].destinationRoute;
    }

    return null;
  },
};
