/**
 * Solace AI - Sanctuary (Profile) Screen
 * Phase 7.5: Sanctuary Empty States, Real Metrics & Settings Link
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/solace';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { moodService } from '@/services/moodService';
import { breathingService } from '@/services/breathingService';
import { chatService } from '@/services/chatService';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { WellnessJourneySummary, MoodEntry } from '@/types/mood';
import { BreathingStats } from '@/types/breathingSession';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function SanctuaryScreen() {
  const { themeColors, isDark } = useTheme();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<WellnessJourneySummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [breathingStats, setBreathingStats] = useState<BreathingStats | null>(null);
  const [conversationsCount, setConversationsCount] = useState<number>(0);

  const loadSanctuaryData = useCallback(async () => {
    const userId = user?.id || 'guest_user';
    try {
      const [fetchedSummary, fetchedRecent, fetchedBreathing, fetchedConversations] =
        await Promise.all([
          moodService.getWellnessJourneySummary(userId),
          moodService.getRecentMoodEntries(userId, 3),
          breathingService.getBreathingStats(userId),
          chatService.getConversations(userId),
        ]);

      setSummary(fetchedSummary);
      setRecentEntries(fetchedRecent);
      setBreathingStats(fetchedBreathing);
      setConversationsCount(fetchedConversations.length);
    } catch (err) {
      console.warn('[SanctuaryScreen] Error loading sanctuary data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSanctuaryData();
    }, [loadSanctuaryData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSanctuaryData();
    } finally {
      setRefreshing(false);
    }
  }, [loadSanctuaryData]);

  const hasAnyActivity =
    (summary && summary.totalEntries > 0) ||
    (breathingStats && breathingStats.totalSessionsCompleted > 0) ||
    conversationsCount > 0;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }>
        {/* Header Bar with Settings Gear */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.tagRow}>
              <View style={[styles.pulseDot, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.tagText, { color: themeColors.primary }]}>
                PERSONAL RETREAT
              </Text>
            </View>
            <Text style={[styles.screenTitle, { color: themeColors.primary }]}>
              Sanctuary
            </Text>
            <Text style={[styles.screenSubtitle, { color: themeColors.textSecondary }]}>
              Your mindful space of gentle reflection
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.settingsButton,
              { backgroundColor: themeColors.secondary, borderColor: themeColors.border },
              pressed && styles.pressed,
            ]}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* User Identity Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
            Shadows.card,
          ]}>
          <View style={styles.profileLeft}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: themeColors.blush, overflow: 'hidden' },
              ]}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarEmoji}>🌿</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: themeColors.text }]}>
                {user?.name || 'Sanctuary Explorer'}
              </Text>
              <Text style={[styles.profileEmail, { color: themeColors.textSecondary }]}>
                {user?.email || 'guest@sanctuary.internal'}
              </Text>
              <View style={[styles.demoBadge, { backgroundColor: themeColors.secondary }]}>
                <Text style={[styles.demoBadgeText, { color: themeColors.primary }]}>
                  {isSupabaseConfigured()
                    ? 'Cloud Sanctuary Traveler'
                    : 'Local Demonstration Sanctuary'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Real Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View
            style={[
              styles.metricCard,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Text style={styles.metricEmoji}>✦</Text>
            <Text style={[styles.metricValue, { color: themeColors.primary }]}>
              {summary ? summary.totalEntries : 0}
            </Text>
            <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
              Mood Check-ins
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Text style={styles.metricEmoji}>🌬️</Text>
            <Text style={[styles.metricValue, { color: themeColors.primary }]}>
              {breathingStats ? breathingStats.totalMinutesBreathed : 0}m
            </Text>
            <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
              Breathed
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Text style={styles.metricEmoji}>💬</Text>
            <Text style={[styles.metricValue, { color: themeColors.primary }]}>
              {conversationsCount}
            </Text>
            <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
              Reflections
            </Text>
          </View>
        </View>

        {/* Empty State vs Real History */}
        {!hasAnyActivity && !isLoading ? (
          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: themeColors.blush }]}>
              <Text style={styles.emptyIconEmoji}>🌿</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.primary }]}>
              Your sanctuary is waiting for its first breath.
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Every gentle pause begins with a single mindful step. Check in with how you feel, take a box breathing pause, or chat with your companion.
            </Text>

            <View style={styles.emptyActionsList}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take a daily mood check-in"
                onPress={() => router.push('/mood-check-in')}
                style={({ pressed }) => [
                  styles.ctaButton,
                  { backgroundColor: themeColors.primary },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.ctaButtonText, { color: themeColors.onPrimary }]}>✦ Daily Mood Check-In</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start guided breathing exercise"
                onPress={() => router.push('/breathing')}
                style={({ pressed }) => [
                  styles.ctaButtonSecondary,
                  { backgroundColor: themeColors.secondary, borderColor: themeColors.border },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.ctaButtonSecText, { color: themeColors.primary }]}>
                  🌬️ Guided Breathing Exercise
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open AI companion chat"
                onPress={() => router.push('/(tabs)/companion')}
                style={({ pressed }) => [
                  styles.ctaButtonSecondary,
                  { backgroundColor: themeColors.secondary, borderColor: themeColors.border },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.ctaButtonSecText, { color: themeColors.primary }]}>
                  💬 Chat with Companion
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.activitySection}>
            <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
              RECENT SANCTUARY RHYTHMS
            </Text>

            {/* Recent Check-Ins */}
            {recentEntries.length > 0 && (
              <View
                style={[
                  styles.activityCard,
                  { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
                  Shadows.card,
                ]}>
                <Text style={[styles.activityCardTitle, { color: themeColors.primary }]}>
                  Recent Moods
                </Text>
                {recentEntries.map((e) => (
                  <View key={e.id} style={styles.activityItemRow}>
                    <Text style={styles.activityEmoji}>{e.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityItemText, { color: themeColors.text }]}>
                        {e.moodLabel}
                      </Text>
                      {e.note ? (
                        <Text
                          numberOfLines={1}
                          style={[styles.activityItemSub, { color: themeColors.textSecondary }]}>
                          "{e.note}"
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.activityDate, { color: themeColors.textMuted }]}>
                      {new Date(e.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Breathing Summary Card */}
            {breathingStats && breathingStats.lastSession && (
              <View
                style={[
                  styles.activityCard,
                  { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
                  Shadows.card,
                ]}>
                <Text style={[styles.activityCardTitle, { color: themeColors.primary }]}>
                  Recent Breathwork
                </Text>
                <View style={styles.activityItemRow}>
                  <Text style={styles.activityEmoji}>🌬️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityItemText, { color: themeColors.text }]}>
                      {breathingStats.lastSession.patternName}
                    </Text>
                    <Text style={[styles.activityItemSub, { color: themeColors.textSecondary }]}>
                      {breathingStats.lastSession.completedCycles} cycles •{' '}
                      {Math.round(breathingStats.lastSession.completedDurationSeconds / 60)}m
                    </Text>
                  </View>
                  <Text style={[styles.activityDate, { color: themeColors.textMuted }]}>
                    {new Date(breathingStats.lastSession.completedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Quick Navigation Links */}
            <View style={styles.quickNavRow}>
              <Pressable
                onPress={() => router.push('/mood-check-in')}
                style={[
                  styles.quickNavBtn,
                  { backgroundColor: themeColors.secondary, borderColor: themeColors.border },
                ]}>
                <Text style={[styles.quickNavBtnText, { color: themeColors.primary }]}>
                  + Check In
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/breathing')}
                style={[
                  styles.quickNavBtn,
                  { backgroundColor: themeColors.secondary, borderColor: themeColors.border },
                ]}>
                <Text style={[styles.quickNavBtnText, { color: themeColors.primary }]}>
                  + Breathe
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(tabs)/companion')}
                style={[
                  styles.quickNavBtn,
                  { backgroundColor: themeColors.secondary, borderColor: themeColors.border },
                ]}>
                <Text style={[styles.quickNavBtnText, { color: themeColors.primary }]}>
                  + Reflect
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl + 50,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 26,
    marginBottom: 2,
  },
  screenSubtitle: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  profileName: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 17,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
  },
  demoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    marginTop: 6,
  },
  demoBadgeText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyIconEmoji: {
    fontSize: 30,
  },
  emptyTitle: {
    fontFamily: FontFamilies.serif.semiBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  emptyActionsList: {
    width: '100%',
    gap: 10,
  },
  ctaButton: {
    paddingVertical: 14,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 14,
  },
  ctaButtonSecondary: {
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonSecText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  activitySection: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionHeading: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  activityCardTitle: {
    fontFamily: FontFamilies.serif.semiBold,
    fontSize: 15,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityItemText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  activityItemSub: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
    fontStyle: 'italic',
  },
  activityDate: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 11,
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickNavBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavBtnText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.85,
  },
});
