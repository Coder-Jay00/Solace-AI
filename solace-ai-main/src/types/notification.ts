/**
 * Solace AI - Local Notifications and Reminders Type Definitions
 * Phase 7.6–7.8: Complete Local Notifications Implementation
 */

export type NotificationCategory = 'mood' | 'breathing' | 'intention' | 'companion';

export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface QuietHoursPreference {
  enabled: boolean;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

export interface ReminderPreference {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  notificationId?: string;
}

export interface WeekdayReminderPreference extends ReminderPreference {
  selectedDays: number[]; // 1-7, where 1 = Sunday, 2 = Monday, ..., 7 = Saturday (Expo standard)
  notificationIds?: string[];
}

export interface NotificationPreferences {
  masterEnabled: boolean;
  moodReminder: ReminderPreference;
  breathingReminder: WeekdayReminderPreference;
  intentionReminder: ReminderPreference;
  companionReminder: WeekdayReminderPreference;
  quietHours: QuietHoursPreference;
  updatedAt?: string;
}

export interface NotificationCategoryConfig {
  category: NotificationCategory;
  title: string;
  body: string;
  channelId: string;
  destinationRoute: string;
  defaultHour: number;
  defaultMinute: number;
  cadence: 'daily' | 'weekdays';
}

export const NOTIFICATION_CHANNELS = {
  mood: {
    id: 'mood-reminders',
    name: 'Mood Check-in Reminders',
    description: 'Gentle daily reminders to check in with your emotional state',
  },
  breathing: {
    id: 'breathing-reminders',
    name: 'Breathing Practice Reminders',
    description: 'Gentle prompts to take a calming breathing pause',
  },
  intention: {
    id: 'intention-reminders',
    name: 'Daily Intention Reminders',
    description: 'Gentle morning reflections to start your day with intention',
  },
  companion: {
    id: 'companion-reminders',
    name: 'Companion Reminders',
    description: 'Gentle prompts to visit your personal sanctuary and companion',
  },
} as const;

export const NOTIFICATION_CONFIGS: Record<NotificationCategory, NotificationCategoryConfig> = {
  mood: {
    category: 'mood',
    title: 'Solace AI',
    body: 'A little moment for yourself. How are you feeling today?',
    channelId: NOTIFICATION_CHANNELS.mood.id,
    destinationRoute: '/mood-check-in',
    defaultHour: 20,
    defaultMinute: 0,
    cadence: 'daily',
  },
  breathing: {
    category: 'breathing',
    title: 'Solace Breathing',
    body: 'Take a pause. A few gentle breaths might help you reset.',
    channelId: NOTIFICATION_CHANNELS.breathing.id,
    destinationRoute: '/breathing',
    defaultHour: 14,
    defaultMinute: 0,
    cadence: 'weekdays',
  },
  intention: {
    category: 'intention',
    title: 'Daily Reflection',
    body: 'Start gently. What is one thing you want to make space for today?',
    channelId: NOTIFICATION_CHANNELS.intention.id,
    destinationRoute: '/(tabs)/home',
    defaultHour: 8,
    defaultMinute: 30,
    cadence: 'daily',
  },
  companion: {
    category: 'companion',
    title: 'Sanctuary Companion',
    body: 'Whenever you feel ready, take a moment to reflect.',
    channelId: NOTIFICATION_CHANNELS.companion.id,
    destinationRoute: '/(tabs)/companion',
    defaultHour: 19,
    defaultMinute: 0,
    cadence: 'weekdays',
  },
};

/**
 * Weekday representations:
 * In Expo Notifications SchedulableTriggerInputTypes.WEEKLY:
 * 1 = Sunday, 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 7 = Saturday
 */
export const WEEKDAY_LABELS: Array<{ day: number; shortLabel: string; fullLabel: string }> = [
  { day: 2, shortLabel: 'M', fullLabel: 'Monday' },
  { day: 3, shortLabel: 'T', fullLabel: 'Tuesday' },
  { day: 4, shortLabel: 'W', fullLabel: 'Wednesday' },
  { day: 5, shortLabel: 'T', fullLabel: 'Thursday' },
  { day: 6, shortLabel: 'F', fullLabel: 'Friday' },
  { day: 7, shortLabel: 'S', fullLabel: 'Saturday' },
  { day: 1, shortLabel: 'S', fullLabel: 'Sunday' },
];

export const DEFAULT_WEEKDAYS = [2, 3, 4, 5, 6]; // Monday through Friday

/**
 * Default preferences: All reminders are OFF by default.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  masterEnabled: false,
  moodReminder: {
    enabled: false,
    hour: NOTIFICATION_CONFIGS.mood.defaultHour,
    minute: NOTIFICATION_CONFIGS.mood.defaultMinute,
  },
  breathingReminder: {
    enabled: false,
    hour: NOTIFICATION_CONFIGS.breathing.defaultHour,
    minute: NOTIFICATION_CONFIGS.breathing.defaultMinute,
    selectedDays: [...DEFAULT_WEEKDAYS],
  },
  intentionReminder: {
    enabled: false,
    hour: NOTIFICATION_CONFIGS.intention.defaultHour,
    minute: NOTIFICATION_CONFIGS.intention.defaultMinute,
  },
  companionReminder: {
    enabled: false,
    hour: NOTIFICATION_CONFIGS.companion.defaultHour,
    minute: NOTIFICATION_CONFIGS.companion.defaultMinute,
    selectedDays: [...DEFAULT_WEEKDAYS],
  },
  quietHours: {
    enabled: false,
    startHour: 22,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
  },
};

/**
 * Validates and safely normalizes notification preferences.
 * Replaces missing, invalid, or corrupted fields with safe defaults.
 */
export function validateNotificationPreferences(raw: any): NotificationPreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const validateHour = (h: any, fallback: number): number => {
    return typeof h === 'number' && Number.isInteger(h) && h >= 0 && h <= 23 ? h : fallback;
  };

  const validateMinute = (m: any, fallback: number): number => {
    return typeof m === 'number' && Number.isInteger(m) && m >= 0 && m <= 59 ? m : fallback;
  };

  const validateDays = (days: any): number[] => {
    if (!Array.isArray(days)) return [...DEFAULT_WEEKDAYS];
    const valid = days.filter((d) => typeof d === 'number' && d >= 1 && d <= 7);
    return valid.length > 0 ? Array.from(new Set(valid)) : [...DEFAULT_WEEKDAYS];
  };

  return {
    masterEnabled: typeof raw.masterEnabled === 'boolean' ? raw.masterEnabled : false,
    moodReminder: {
      enabled: typeof raw.moodReminder?.enabled === 'boolean' ? raw.moodReminder.enabled : false,
      hour: validateHour(raw.moodReminder?.hour, NOTIFICATION_CONFIGS.mood.defaultHour),
      minute: validateMinute(raw.moodReminder?.minute, NOTIFICATION_CONFIGS.mood.defaultMinute),
      notificationId: typeof raw.moodReminder?.notificationId === 'string' ? raw.moodReminder.notificationId : undefined,
    },
    breathingReminder: {
      enabled: typeof raw.breathingReminder?.enabled === 'boolean' ? raw.breathingReminder.enabled : false,
      hour: validateHour(raw.breathingReminder?.hour, NOTIFICATION_CONFIGS.breathing.defaultHour),
      minute: validateMinute(raw.breathingReminder?.minute, NOTIFICATION_CONFIGS.breathing.defaultMinute),
      selectedDays: validateDays(raw.breathingReminder?.selectedDays),
      notificationId: typeof raw.breathingReminder?.notificationId === 'string' ? raw.breathingReminder.notificationId : undefined,
      notificationIds: Array.isArray(raw.breathingReminder?.notificationIds)
        ? raw.breathingReminder.notificationIds.filter((id: any) => typeof id === 'string')
        : undefined,
    },
    intentionReminder: {
      enabled: typeof raw.intentionReminder?.enabled === 'boolean' ? raw.intentionReminder.enabled : false,
      hour: validateHour(raw.intentionReminder?.hour, NOTIFICATION_CONFIGS.intention.defaultHour),
      minute: validateMinute(raw.intentionReminder?.minute, NOTIFICATION_CONFIGS.intention.defaultMinute),
      notificationId: typeof raw.intentionReminder?.notificationId === 'string' ? raw.intentionReminder.notificationId : undefined,
    },
    companionReminder: {
      enabled: typeof raw.companionReminder?.enabled === 'boolean' ? raw.companionReminder.enabled : false,
      hour: validateHour(raw.companionReminder?.hour, NOTIFICATION_CONFIGS.companion.defaultHour),
      minute: validateMinute(raw.companionReminder?.minute, NOTIFICATION_CONFIGS.companion.defaultMinute),
      selectedDays: validateDays(raw.companionReminder?.selectedDays),
      notificationId: typeof raw.companionReminder?.notificationId === 'string' ? raw.companionReminder.notificationId : undefined,
      notificationIds: Array.isArray(raw.companionReminder?.notificationIds)
        ? raw.companionReminder.notificationIds.filter((id: any) => typeof id === 'string')
        : undefined,
    },
    quietHours: {
      enabled: typeof raw.quietHours?.enabled === 'boolean' ? raw.quietHours.enabled : false,
      startHour: validateHour(raw.quietHours?.startHour, 22),
      startMinute: validateMinute(raw.quietHours?.startMinute, 0),
      endHour: validateHour(raw.quietHours?.endHour, 7),
      endMinute: validateMinute(raw.quietHours?.endMinute, 0),
    },
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

