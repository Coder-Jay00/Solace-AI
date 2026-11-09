/**
 * Solace AI - Settings Screen
 * Phase 7.5: Settings, Theme Preferences & Data Management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  BackHandler,
  ActivityIndicator,
  Switch,
  AppState,
  AppStateStatus,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/solace';
import { useAuth } from '@/context/AuthContext';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  NotificationPreferences,
  NotificationCategory,
  NotificationPermissionStatus,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notification';
import { notificationService } from '@/services/notificationService';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { TimePickerModal } from '@/components/notifications/TimePickerModal';
import { WeekdaySelector } from '@/components/notifications/WeekdaySelector';
import { NotificationPreviewCard } from '@/components/notifications/NotificationPreviewCard';
import { PermissionExplanationModal } from '@/components/notifications/PermissionExplanationModal';

const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

function formatTimeDisplay(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const minStr = String(minute).padStart(2, '0');
  return `${h12}:${minStr} ${period}`;
}

export default function SettingsScreen() {
  const { themeMode, activeTheme, themeColors, setThemeMode, isDark } = useTheme();
  const { user, signOut } = useAuth();

  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Notification state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
  const [timeModalTarget, setTimeModalTarget] = useState<
    'mood' | 'breathing' | 'intention' | 'companion' | 'quietStart' | 'quietEnd' | null
  >(null);
  const [timeModalTitle, setTimeModalTitle] = useState<string>('Set Reminder Time');
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // Load saved preferences and permission status on mount
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const [prefs, perm] = await Promise.all([
          notificationService.loadPreferences(user?.id),
          notificationService.getPermissionStatus(),
        ]);
        if (isMounted) {
          setNotificationPrefs(prefs);
          setPermissionStatus(perm);
        }
      } catch (err) {
        console.warn('[SettingsScreen] Failed loading notification settings:', err);
      }
    };
    loadSettings();

    // Recheck permissions when returning to the app from OS settings
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const perm = await notificationService.getPermissionStatus();
        if (isMounted) setPermissionStatus(perm);
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, [user?.id]);

  const handleSelectTheme = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const handleToggleMaster = async (newValue: boolean) => {
    if (newValue) {
      const perm = await notificationService.getPermissionStatus();
      if (perm !== 'granted') {
        const requested = await notificationService.requestPermissions();
        setPermissionStatus(requested);
        if (requested !== 'granted') {
          setShowPermissionModal(true);
          return;
        }
      }
    }

    const updated: NotificationPreferences = {
      ...notificationPrefs,
      masterEnabled: newValue,
    };
    setNotificationPrefs(updated);
    await notificationService.savePreferences(user?.id, updated);
    const reconciled = await notificationService.reconcileSchedules(user?.id);
    setNotificationPrefs(reconciled);
  };

  const handleToggleCategory = async (category: NotificationCategory, newValue: boolean) => {
    if (!notificationPrefs.masterEnabled && newValue) {
      Alert.alert(
        'Enable Notifications First',
        'Please turn on master notifications above to activate this reminder.',
        [{ text: 'OK' }]
      );
      return;
    }

    const updated: NotificationPreferences = {
      ...notificationPrefs,
      ...(category === 'mood'
        ? { moodReminder: { ...notificationPrefs.moodReminder, enabled: newValue } }
        : {}),
      ...(category === 'breathing'
        ? { breathingReminder: { ...notificationPrefs.breathingReminder, enabled: newValue } }
        : {}),
      ...(category === 'intention'
        ? { intentionReminder: { ...notificationPrefs.intentionReminder, enabled: newValue } }
        : {}),
      ...(category === 'companion'
        ? { companionReminder: { ...notificationPrefs.companionReminder, enabled: newValue } }
        : {}),
    };
    setNotificationPrefs(updated);
    await notificationService.savePreferences(user?.id, updated);
    const reconciled = await notificationService.reconcileSchedules(user?.id);
    setNotificationPrefs(reconciled);
  };

  const handleToggleWeekday = async (category: 'breathing' | 'companion', day: number) => {
    const currentDays =
      category === 'breathing'
        ? notificationPrefs.breathingReminder.selectedDays
        : notificationPrefs.companionReminder.selectedDays;

    let nextDays: number[];
    if (currentDays.includes(day)) {
      if (currentDays.length <= 1) {
        Alert.alert('Notice', 'Please keep at least one day selected.');
        return;
      }
      nextDays = currentDays.filter((d) => d !== day);
    } else {
      nextDays = [...currentDays, day].sort();
    }

    const updated: NotificationPreferences = {
      ...notificationPrefs,
      ...(category === 'breathing'
        ? { breathingReminder: { ...notificationPrefs.breathingReminder, selectedDays: nextDays } }
        : {}),
      ...(category === 'companion'
        ? { companionReminder: { ...notificationPrefs.companionReminder, selectedDays: nextDays } }
        : {}),
    };
    setNotificationPrefs(updated);
    await notificationService.savePreferences(user?.id, updated);
    if (notificationPrefs.masterEnabled) {
      const reconciled = await notificationService.reconcileSchedules(user?.id);
      setNotificationPrefs(reconciled);
    }
  };

  const handleToggleQuietHours = async (newValue: boolean) => {
    const updated: NotificationPreferences = {
      ...notificationPrefs,
      quietHours: {
        ...notificationPrefs.quietHours,
        enabled: newValue,
      },
    };
    setNotificationPrefs(updated);
    await notificationService.savePreferences(user?.id, updated);
    if (notificationPrefs.masterEnabled) {
      const reconciled = await notificationService.reconcileSchedules(user?.id);
      setNotificationPrefs(reconciled);
    }
  };

  const openTimePicker = (
    target: 'mood' | 'breathing' | 'intention' | 'companion' | 'quietStart' | 'quietEnd',
    title: string
  ) => {
    setTimeModalTarget(target);
    setTimeModalTitle(title);
    setShowTimeModal(true);
  };

  const handleSaveTime = async (hour: number, minute: number) => {
    setShowTimeModal(false);
    if (!timeModalTarget) return;

    let updated: NotificationPreferences = { ...notificationPrefs };
    if (timeModalTarget === 'mood') {
      updated.moodReminder = { ...updated.moodReminder, hour, minute };
    } else if (timeModalTarget === 'breathing') {
      updated.breathingReminder = { ...updated.breathingReminder, hour, minute };
    } else if (timeModalTarget === 'intention') {
      updated.intentionReminder = { ...updated.intentionReminder, hour, minute };
    } else if (timeModalTarget === 'companion') {
      updated.companionReminder = { ...updated.companionReminder, hour, minute };
    } else if (timeModalTarget === 'quietStart') {
      updated.quietHours = { ...updated.quietHours, startHour: hour, startMinute: minute };
    } else if (timeModalTarget === 'quietEnd') {
      updated.quietHours = { ...updated.quietHours, endHour: hour, endMinute: minute };
    }

    setNotificationPrefs(updated);
    await notificationService.savePreferences(user?.id, updated);
    if (notificationPrefs.masterEnabled) {
      const reconciled = await notificationService.reconcileSchedules(user?.id);
      setNotificationPrefs(reconciled);
    }
  };

  const getInitialTimeForModal = () => {
    if (timeModalTarget === 'mood') {
      return {
        hour: notificationPrefs.moodReminder.hour,
        minute: notificationPrefs.moodReminder.minute,
      };
    }
    if (timeModalTarget === 'breathing') {
      return {
        hour: notificationPrefs.breathingReminder.hour,
        minute: notificationPrefs.breathingReminder.minute,
      };
    }
    if (timeModalTarget === 'intention') {
      return {
        hour: notificationPrefs.intentionReminder.hour,
        minute: notificationPrefs.intentionReminder.minute,
      };
    }
    if (timeModalTarget === 'companion') {
      return {
        hour: notificationPrefs.companionReminder.hour,
        minute: notificationPrefs.companionReminder.minute,
      };
    }
    if (timeModalTarget === 'quietStart') {
      return {
        hour: notificationPrefs.quietHours.startHour,
        minute: notificationPrefs.quietHours.startMinute,
      };
    }
    if (timeModalTarget === 'quietEnd') {
      return {
        hour: notificationPrefs.quietHours.endHour,
        minute: notificationPrefs.quietHours.endMinute,
      };
    }
    return { hour: 8, minute: 0 };
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
    router.replace('/login');
  };

  const handleConfirmClearData = async () => {
    setIsClearing(true);
    try {
      // Clear Solace reminders and preferences
      await notificationService.cancelAllSolaceReminders();
      await notificationService.clearPreferences(user?.id);

      // Clear all Solace AsyncStorage keys
      const allKeys = await storage.getAllKeys();
      const solaceKeys = allKeys.filter((k: string) => k.startsWith('@solace_'));
      if (solaceKeys.length > 0) {
        await storage.multiRemove(solaceKeys);
      }
      await signOut();
      setShowClearModal(false);
      Alert.alert(
        'Data Cleared',
        'All local reflections, breathing logs, and chat records have been removed from your device.',
        [
          {
            text: 'Return to Start',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (err) {
      console.warn('[SettingsScreen] Failed to clear data:', err);
      Alert.alert('Error', 'Failed to clear local data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <ScreenContainer withTopInset withBottomInset>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, { backgroundColor: themeColors.secondary }, pressed && styles.pressed]}>
          <Text style={[styles.backIcon, { color: themeColors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeColors.primary }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* 1. Account Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
            ACCOUNT & SANCTUARY
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <View style={styles.accountRow}>
              <View style={[styles.avatarCircle, { backgroundColor: themeColors.blush }]}>
                <Text style={styles.avatarEmoji}>🌿</Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={[styles.userName, { color: themeColors.text }]}>
                  {user?.name || 'Sanctuary Guest'}
                </Text>
                <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
                  {user?.email || 'guest@sanctuary.internal'}
                </Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.demoBadge, { backgroundColor: themeColors.secondary }]}>
                <Text style={[styles.demoBadgeText, { color: themeColors.primary }]}>
                  {isSupabaseConfigured() && user?.email && !user.email.endsWith('@sanctuary.internal')
                    ? '✦ Cloud Sanctuary Account'
                    : 'Local Demo Account'}
                </Text>
              </View>
              {user?.consentVersion && (
                <View style={[styles.demoBadge, { backgroundColor: themeColors.secondary }]}>
                  <Text style={[styles.demoBadgeText, { color: themeColors.primary }]}>
                    Consent v{user.consentVersion}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 2. Visual Theme System */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
            APPEARANCE & THEME
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Text style={[styles.cardSubtitle, { color: themeColors.textSecondary }]}>
              Choose how Solace AI appears on your device.
            </Text>

            <View style={styles.themeOptionsGrid}>
              {/* System Option */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set theme to system default"
                onPress={() => handleSelectTheme('system')}
                style={[
                  styles.themeOptionCard,
                  {
                    backgroundColor: themeMode === 'system' ? themeColors.blush : themeColors.secondary,
                    borderColor: themeMode === 'system' ? themeColors.primary : themeColors.border,
                  },
                  themeMode === 'system' && styles.themeSelectedBorder,
                ]}>
                <Text style={styles.themeEmoji}>📱</Text>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    {
                      color: themeMode === 'system' ? themeColors.primary : themeColors.text,
                      fontFamily: themeMode === 'system' ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                    },
                  ]}>
                  System Default
                </Text>
                <Text style={[styles.themeOptionDesc, { color: themeColors.textSecondary }]}>
                  Follows your OS appearance
                </Text>
                {themeMode === 'system' && (
                  <View style={[styles.selectedCheckBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={[styles.selectedCheckText, { color: themeColors.onPrimary }]}>✓</Text>
                  </View>
                )}
              </Pressable>

              {/* Light Mode Option */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set theme to light mode"
                onPress={() => handleSelectTheme('light')}
                style={[
                  styles.themeOptionCard,
                  {
                    backgroundColor: themeMode === 'light' ? themeColors.blush : themeColors.secondary,
                    borderColor: themeMode === 'light' ? themeColors.primary : themeColors.border,
                  },
                  themeMode === 'light' && styles.themeSelectedBorder,
                ]}>
                <Text style={styles.themeEmoji}>☀️</Text>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    {
                      color: themeMode === 'light' ? themeColors.primary : themeColors.text,
                      fontFamily: themeMode === 'light' ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                    },
                  ]}>
                  Morning Sky (Light)
                </Text>
                <Text style={[styles.themeOptionDesc, { color: themeColors.textSecondary }]}>
                  Soft powder-blue and blush rose palette
                </Text>
                {themeMode === 'light' && (
                  <View style={[styles.selectedCheckBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={[styles.selectedCheckText, { color: themeColors.onPrimary }]}>✓</Text>
                  </View>
                )}
              </Pressable>

              {/* Dark Mode Option */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set theme to dark mode"
                onPress={() => handleSelectTheme('dark')}
                style={[
                  styles.themeOptionCard,
                  {
                    backgroundColor: themeMode === 'dark' ? themeColors.blush : themeColors.secondary,
                    borderColor: themeMode === 'dark' ? themeColors.primary : themeColors.border,
                  },
                  themeMode === 'dark' && styles.themeSelectedBorder,
                ]}>
                <Text style={styles.themeEmoji}>🌙</Text>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    {
                      color: themeMode === 'dark' ? themeColors.primary : themeColors.text,
                      fontFamily: themeMode === 'dark' ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                    },
                  ]}>
                  Evening Sky (Dark)
                </Text>
                <Text style={[styles.themeOptionDesc, { color: themeColors.textSecondary }]}>
                  Deep slate twilight with dusty rose accents
                </Text>
                {themeMode === 'dark' && (
                  <View style={[styles.selectedCheckBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={[styles.selectedCheckText, { color: themeColors.onPrimary }]}>✓</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* 3. Notifications & Routine */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
            NOTIFICATIONS & REMINDERS
          </Text>
          <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
            Create gentle reminders that fit your routine.
          </Text>

          {/* Master Notification Toggle Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.masterTitle, { color: themeColors.text }]}>
                  Enable Reminders
                </Text>
                <Text style={[styles.masterDesc, { color: themeColors.textSecondary }]}>
                  Receive gentle local invitations to pause, breathe, and reflect on your terms.
                </Text>
              </View>
              <Switch
                value={notificationPrefs.masterEnabled}
                onValueChange={handleToggleMaster}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={isDark ? themeColors.surfaceElevated : '#FFFFFF'}
                accessibilityLabel="Master reminder switch"
              />
            </View>

            {/* Permission Status Badge */}
            <View style={styles.badgeRow}>
              {permissionStatus === 'granted' && (
                <View style={[styles.permBadge, { backgroundColor: themeColors.secondary }]}>
                  <Text style={[styles.permBadgeText, { color: themeColors.success }]}>
                    ✓ System Notifications Allowed
                  </Text>
                </View>
              )}
              {permissionStatus === 'denied' && (
                <Pressable
                  onPress={() => setShowPermissionModal(true)}
                  style={[styles.permBadge, { backgroundColor: themeColors.errorContainer }]}>
                  <Text style={[styles.permBadgeText, { color: themeColors.error }]}>
                    ⚠ Permission Denied (Tap to fix)
                  </Text>
                </Pressable>
              )}
              {permissionStatus === 'undetermined' && (
                <View style={[styles.permBadge, { backgroundColor: themeColors.secondary }]}>
                  <Text style={[styles.permBadgeText, { color: themeColors.textSecondary }]}>
                    🔔 Requested Upon Enabling
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Reminder Categories Container */}
          <View style={styles.remindersList}>
            {/* Category 1: Daily Mood Check-in */}
            <View
              style={[
                styles.reminderCard,
                { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
                Shadows.card,
                !notificationPrefs.masterEnabled && styles.disabledCard,
              ]}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleGroup}>
                  <View style={[styles.categoryIconCircle, { backgroundColor: themeColors.blush }]}>
                    <Text style={styles.categoryIconEmoji}>🌿</Text>
                  </View>
                  <View style={styles.reminderTitleText}>
                    <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
                      Daily Mood Check-in
                    </Text>
                    <Text style={[styles.categoryCadence, { color: themeColors.textSecondary }]}>
                      Daily reflection
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationPrefs.moodReminder.enabled}
                  onValueChange={(val) => handleToggleCategory('mood', val)}
                  disabled={!notificationPrefs.masterEnabled}
                  trackColor={{ false: themeColors.border, true: themeColors.primary }}
                  thumbColor={isDark ? themeColors.surfaceElevated : '#FFFFFF'}
                  accessibilityLabel="Daily Mood Check-in reminder toggle"
                />
              </View>

              <Text style={[styles.categoryQuote, { color: themeColors.textSecondary }]}>
                "A little moment for yourself. How are you feeling today?"
              </Text>

              <View style={[styles.timeRow, { borderTopColor: themeColors.border }]}>
                <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>
                  Reminder Time
                </Text>
                <Pressable
                  disabled={!notificationPrefs.masterEnabled}
                  onPress={() => openTimePicker('mood', 'Mood Check-in Time')}
                  style={({ pressed }) => [
                    styles.timePill,
                    {
                      backgroundColor: notificationPrefs.moodReminder.enabled
                        ? themeColors.blush
                        : themeColors.secondary,
                      borderColor: notificationPrefs.moodReminder.enabled
                        ? themeColors.primary
                        : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.timePillText,
                      {
                        color: notificationPrefs.moodReminder.enabled
                          ? themeColors.primary
                          : themeColors.textSecondary,
                      },
                    ]}>
                    🕒 {formatTimeDisplay(notificationPrefs.moodReminder.hour, notificationPrefs.moodReminder.minute)}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Category 2: Breathing Practice */}
            <View
              style={[
                styles.reminderCard,
                { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
                Shadows.card,
                !notificationPrefs.masterEnabled && styles.disabledCard,
              ]}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleGroup}>
                  <View style={[styles.categoryIconCircle, { backgroundColor: themeColors.secondary }]}>
                    <Text style={styles.categoryIconEmoji}>🌬️</Text>
                  </View>
                  <View style={styles.reminderTitleText}>
                    <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
                      Breathing Practice
                    </Text>
                    <Text style={[styles.categoryCadence, { color: themeColors.textSecondary }]}>
                      Mindful pause
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationPrefs.breathingReminder.enabled}
                  onValueChange={(val) => handleToggleCategory('breathing', val)}
                  disabled={!notificationPrefs.masterEnabled}
                  trackColor={{ false: themeColors.border, true: themeColors.primary }}
                  thumbColor={isDark ? themeColors.surfaceElevated : '#FFFFFF'}
                  accessibilityLabel="Breathing Practice reminder toggle"
                />
              </View>

              <Text style={[styles.categoryQuote, { color: themeColors.textSecondary }]}>
                "Take a pause. A few gentle breaths might help you reset."
              </Text>

              <View style={[styles.timeRow, { borderTopColor: themeColors.border }]}>
                <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>
                  Reminder Time
                </Text>
                <Pressable
                  disabled={!notificationPrefs.masterEnabled}
                  onPress={() => openTimePicker('breathing', 'Breathing Reminder Time')}
                  style={({ pressed }) => [
                    styles.timePill,
                    {
                      backgroundColor: notificationPrefs.breathingReminder.enabled
                        ? themeColors.blush
                        : themeColors.secondary,
                      borderColor: notificationPrefs.breathingReminder.enabled
                        ? themeColors.primary
                        : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.timePillText,
                      {
                        color: notificationPrefs.breathingReminder.enabled
                          ? themeColors.primary
                          : themeColors.textSecondary,
                      },
                    ]}>
                    🕒 {formatTimeDisplay(notificationPrefs.breathingReminder.hour, notificationPrefs.breathingReminder.minute)}
                  </Text>
                </Pressable>
              </View>

              <WeekdaySelector
                selectedDays={notificationPrefs.breathingReminder.selectedDays}
                onToggleDay={(day) => handleToggleWeekday('breathing', day)}
                disabled={!notificationPrefs.masterEnabled || !notificationPrefs.breathingReminder.enabled}
              />
            </View>

            {/* Category 3: Daily Intention */}
            <View
              style={[
                styles.reminderCard,
                { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
                Shadows.card,
                !notificationPrefs.masterEnabled && styles.disabledCard,
              ]}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleGroup}>
                  <View style={[styles.categoryIconCircle, { backgroundColor: themeColors.blush }]}>
                    <Text style={styles.categoryIconEmoji}>☀️</Text>
                  </View>
                  <View style={styles.reminderTitleText}>
                    <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
                      Daily Intention
                    </Text>
                    <Text style={[styles.categoryCadence, { color: themeColors.textSecondary }]}>
                      Morning grounding
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationPrefs.intentionReminder.enabled}
                  onValueChange={(val) => handleToggleCategory('intention', val)}
                  disabled={!notificationPrefs.masterEnabled}
                  trackColor={{ false: themeColors.border, true: themeColors.primary }}
                  thumbColor={isDark ? themeColors.surfaceElevated : '#FFFFFF'}
                  accessibilityLabel="Daily Intention reminder toggle"
                />
              </View>

              <Text style={[styles.categoryQuote, { color: themeColors.textSecondary }]}>
                "Start gently. What is one thing you want to make space for today?"
              </Text>

              <View style={[styles.timeRow, { borderTopColor: themeColors.border }]}>
                <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>
                  Reminder Time
                </Text>
                <Pressable
                  disabled={!notificationPrefs.masterEnabled}
                  onPress={() => openTimePicker('intention', 'Daily Intention Time')}
                  style={({ pressed }) => [
                    styles.timePill,
                    {
                      backgroundColor: notificationPrefs.intentionReminder.enabled
                        ? themeColors.blush
                        : themeColors.secondary,
                      borderColor: notificationPrefs.intentionReminder.enabled
                        ? themeColors.primary
                        : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.timePillText,
                      {
                        color: notificationPrefs.intentionReminder.enabled
                          ? themeColors.primary
                          : themeColors.textSecondary,
                      },
                    ]}>
                    🕒 {formatTimeDisplay(notificationPrefs.intentionReminder.hour, notificationPrefs.intentionReminder.minute)}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Category 4: Companion Reminder */}
            <View
              style={[
                styles.reminderCard,
                { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
                Shadows.card,
                !notificationPrefs.masterEnabled && styles.disabledCard,
              ]}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleGroup}>
                  <View style={[styles.categoryIconCircle, { backgroundColor: themeColors.secondary }]}>
                    <Text style={styles.categoryIconEmoji}>💬</Text>
                  </View>
                  <View style={styles.reminderTitleText}>
                    <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
                      Sanctuary Companion
                    </Text>
                    <Text style={[styles.categoryCadence, { color: themeColors.textSecondary }]}>
                      Evening reflection
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationPrefs.companionReminder.enabled}
                  onValueChange={(val) => handleToggleCategory('companion', val)}
                  disabled={!notificationPrefs.masterEnabled}
                  trackColor={{ false: themeColors.border, true: themeColors.primary }}
                  thumbColor={isDark ? themeColors.surfaceElevated : '#FFFFFF'}
                  accessibilityLabel="Companion reminder toggle"
                />
              </View>

              <Text style={[styles.categoryQuote, { color: themeColors.textSecondary }]}>
                "Whenever you feel ready, take a moment to reflect."
              </Text>

              <View style={[styles.timeRow, { borderTopColor: themeColors.border }]}>
                <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>
                  Reminder Time
                </Text>
                <Pressable
                  disabled={!notificationPrefs.masterEnabled}
                  onPress={() => openTimePicker('companion', 'Companion Reminder Time')}
                  style={({ pressed }) => [
                    styles.timePill,
                    {
                      backgroundColor: notificationPrefs.companionReminder.enabled
                        ? themeColors.blush
                        : themeColors.secondary,
                      borderColor: notificationPrefs.companionReminder.enabled
                        ? themeColors.primary
                        : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.timePillText,
                      {
                        color: notificationPrefs.companionReminder.enabled
                          ? themeColors.primary
                          : themeColors.textSecondary,
                      },
                    ]}>
                    🕒 {formatTimeDisplay(notificationPrefs.companionReminder.hour, notificationPrefs.companionReminder.minute)}
                  </Text>
                </Pressable>
              </View>

              <WeekdaySelector
                selectedDays={notificationPrefs.companionReminder.selectedDays}
                onToggleDay={(day) => handleToggleWeekday('companion', day)}
                disabled={!notificationPrefs.masterEnabled || !notificationPrefs.companionReminder.enabled}
              />
            </View>
          </View>

          {/* Quiet Hours Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.masterTitle, { color: themeColors.text }]}>
                  Respect Quiet Hours
                </Text>
                <Text style={[styles.masterDesc, { color: themeColors.textSecondary }]}>
                  During quiet hours, reminders will pause and gently arrive once your quiet window ends.
                </Text>
              </View>
              <Switch
                value={notificationPrefs.quietHours.enabled}
                onValueChange={handleToggleQuietHours}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={isDark ? themeColors.surfaceElevated : '#FFFFFF'}
                accessibilityLabel="Respect quiet hours toggle"
              />
            </View>

            {notificationPrefs.quietHours.enabled && (
              <View style={[styles.quietTimesContainer, { borderTopColor: themeColors.border }]}>
                <View style={styles.quietTimeItem}>
                  <Text style={[styles.quietLabel, { color: themeColors.textSecondary }]}>
                    STARTS AT
                  </Text>
                  <Pressable
                    onPress={() => openTimePicker('quietStart', 'Quiet Hours Start Time')}
                    style={[styles.timePill, { backgroundColor: themeColors.secondary, borderColor: themeColors.border }]}>
                    <Text style={[styles.timePillText, { color: themeColors.primary }]}>
                      🌙 {formatTimeDisplay(notificationPrefs.quietHours.startHour, notificationPrefs.quietHours.startMinute)}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.quietTimeItem}>
                  <Text style={[styles.quietLabel, { color: themeColors.textSecondary }]}>
                    ENDS AT
                  </Text>
                  <Pressable
                    onPress={() => openTimePicker('quietEnd', 'Quiet Hours End Time')}
                    style={[styles.timePill, { backgroundColor: themeColors.secondary, borderColor: themeColors.border }]}>
                    <Text style={[styles.timePillText, { color: themeColors.primary }]}>
                      ☀️ {formatTimeDisplay(notificationPrefs.quietHours.endHour, notificationPrefs.quietHours.endMinute)}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {notificationPrefs.quietHours.enabled &&
              notificationPrefs.quietHours.startHour > notificationPrefs.quietHours.endHour && (
                <Text style={[styles.quietNote, { color: themeColors.textSecondary }]}>
                  ☾ Window crosses midnight until next morning.
                </Text>
              )}
          </View>

          {/* Static Notification Preview Card */}
          <NotificationPreviewCard />
        </View>

        {/* 4. Privacy & Legal Documents */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
            LEGAL & PRIVACY DISCLOSURES
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Pressable
              onPress={() => router.push('/terms')}
              accessibilityRole="button"
              accessibilityLabel="View Terms of Service"
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
              <View style={styles.linkLeft}>
                <Text style={styles.linkIcon}>📜</Text>
                <View>
                  <Text style={[styles.linkTitle, { color: themeColors.text }]}>
                    Terms of Service
                  </Text>
                  <Text style={[styles.linkSubtitle, { color: themeColors.textSecondary }]}>
                    Self-care scope & clinical disclaimer (v1.0.0)
                  </Text>
                </View>
              </View>
              <Text style={[styles.linkChevron, { color: themeColors.primary }]}>→</Text>
            </Pressable>

            <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />

            <Pressable
              onPress={() => router.push('/privacy')}
              accessibilityRole="button"
              accessibilityLabel="View Privacy Policy"
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
              <View style={styles.linkLeft}>
                <Text style={styles.linkIcon}>🔒</Text>
                <View>
                  <Text style={[styles.linkTitle, { color: themeColors.text }]}>
                    Privacy Policy
                  </Text>
                  <Text style={[styles.linkSubtitle, { color: themeColors.textSecondary }]}>
                    Local-first storage & zero third-party tracking
                  </Text>
                </View>
              </View>
              <Text style={[styles.linkChevron, { color: themeColors.primary }]}>→</Text>
            </Pressable>
          </View>
        </View>

        {/* 4. Application Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
            ABOUT SOLACE AI
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Version</Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                1.0.0-prototype
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Framework
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                Expo SDK 54 • React Native 0.81
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Storage Architecture
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                Local-first • Offline-ready
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Active Theme
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.primary }]}>
                {activeTheme === 'dark' ? 'Evening Sky (Dark)' : 'Morning Sky (Light)'} ({themeMode})
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Cloud & Database Architecture */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
            CLOUD & DATABASE SYNCHRONIZATION
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Backend Architecture
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                Supabase PostgreSQL
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Security Model
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.text }]}>
                Row-Level Security (RLS)
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                Local Environment
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isSupabaseConfigured() ? themeColors.success : themeColors.warning },
                ]}>
                {isSupabaseConfigured() ? '✓ Configured in .env' : 'Local Demonstration Mode'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                SQL Schema File
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.primary }]}>
                supabase/schema.sql
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Destructive Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
            DATA & SESSION MANAGEMENT
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={() => setShowLogoutModal(true)}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: themeColors.secondary, borderColor: themeColors.border },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>
              Log Out of Session
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all local data"
            onPress={() => setShowClearModal(true)}
            style={({ pressed }) => [
              styles.dangerButton,
              { backgroundColor: themeColors.errorContainer, borderColor: themeColors.error },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.dangerButtonText, { color: themeColors.error }]}>Clear All Local Data</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: themeColors.surfaceElevated },
              Shadows.floating,
            ]}>
            <Text style={[styles.modalTitle, { color: themeColors.primary }]}>Log Out?</Text>
            <Text style={[styles.modalBody, { color: themeColors.textSecondary }]}>
              {isSupabaseConfigured() && user?.email && !user.email.endsWith('@sanctuary.internal')
                ? 'You will be safely signed out of your Solace account on this device. You can sign back in anytime.'
                : 'You will be signed out of this demonstration session. In this local demonstration phase, passwords are never stored locally on device without a cloud backend, so re-logging in will require starting a new demo session.'}
            </Text>
            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={[styles.modalCancelBtn, { backgroundColor: themeColors.secondary }]}>
                <Text style={[styles.modalCancelText, { color: themeColors.primary }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmLogout}
                style={[styles.modalConfirmBtn, { backgroundColor: themeColors.primary }]}>
                <Text style={[styles.modalConfirmText, { color: themeColors.onPrimary }]}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear All Data Modal */}
      <Modal visible={showClearModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: themeColors.surfaceElevated },
              Shadows.floating,
            ]}>
            <Text style={[styles.modalTitle, { color: themeColors.error }]}>
              Clear All Local Data?
            </Text>
            <Text style={[styles.modalBody, { color: themeColors.text }]}>
              This will permanently delete all your mood check-ins, AI companion reflections, breathing sessions, and saved preferences from this device.
            </Text>
            <Text style={[styles.modalWarningText, { color: themeColors.warning }]}>
              This action cannot be undone.
            </Text>

            {isClearing ? (
              <ActivityIndicator size="small" color={themeColors.error} style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => setShowClearModal(false)}
                  style={[styles.modalCancelBtn, { backgroundColor: themeColors.secondary }]}>
                  <Text style={[styles.modalCancelText, { color: themeColors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmClearData}
                  style={[styles.modalDangerBtn, { backgroundColor: themeColors.error }]}>
                  <Text style={[styles.modalDangerText, { color: '#FFFFFF' }]}>Yes, Clear Everything</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimeModal}
        title={timeModalTitle}
        initialHour={getInitialTimeForModal().hour}
        initialMinute={getInitialTimeForModal().minute}
        onSave={handleSaveTime}
        onClose={() => setShowTimeModal(false)}
      />

      {/* Permission Explanation Modal */}
      <PermissionExplanationModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontFamily: FontFamilies.sans.bold,
  },
  headerTitle: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: Spacing.marginMobile,
    paddingBottom: Spacing['2xl'] + 20,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionHeading: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardSubtitle: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    marginBottom: 6,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  accountDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 16,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  demoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  demoBadgeText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
  },
  themeOptionsGrid: {
    gap: 10,
  },
  themeOptionCard: {
    borderWidth: 1.5,
    borderRadius: Radii.md,
    padding: Spacing.md,
    position: 'relative',
  },
  themeSelectedBorder: {
    borderWidth: 2,
  },
  themeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  themeOptionTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  themeOptionDesc: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: {
    color: '#FFFFFF',
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  linkIcon: {
    fontSize: 18,
  },
  linkTitle: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  linkSubtitle: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
  },
  linkChevron: {
    fontSize: 16,
    fontFamily: FontFamilies.sans.bold,
  },
  cardDivider: {
    height: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
  },
  infoValue: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 13,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  dangerButton: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.marginMobile,
  },
  modalCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 18,
  },
  modalBody: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  modalWarningText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 14,
  },
  modalDangerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDangerText: {
    color: '#FFFFFF',
    fontFamily: FontFamilies.sans.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  sectionSubtitle: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  switchInfo: {
    flex: 1,
    gap: 2,
  },
  masterTitle: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 15,
  },
  masterDesc: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  permBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  permBadgeText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
  },
  remindersList: {
    gap: 10,
    marginTop: 4,
  },
  reminderCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 8,
  },
  disabledCard: {
    opacity: 0.65,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconEmoji: {
    fontSize: 18,
  },
  reminderTitleText: {
    flex: 1,
    gap: 1,
  },
  categoryTitle: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  categoryCadence: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 11,
  },
  categoryQuote: {
    fontFamily: FontFamilies.serif.italic,
    fontSize: 13,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  timeLabel: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 12,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  timePillText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
  },
  quietTimesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
  },
  quietTimeItem: {
    flex: 1,
    gap: 4,
  },
  quietLabel: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  quietNote: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
