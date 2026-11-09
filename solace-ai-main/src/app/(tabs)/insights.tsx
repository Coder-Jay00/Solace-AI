/**
 * Solace AI - Wellness Insights Screen
 * Phase 7.5: Insights with Real Data, Breathing Integration & Pull-to-Refresh
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer, SolaceHeader, SolaceCard } from '@/components/solace';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { moodService } from '@/services/moodService';
import { breathingService } from '@/services/breathingService';
import { WellnessJourneySummary, MoodEntry } from '@/types/mood';
import { BreathingStats, BreathingSession } from '@/types/breathingSession';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function InsightsScreen() {
  const { themeColors } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<WellnessJourneySummary | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [breathingStats, setBreathingStats] = useState<BreathingStats | null>(null);
  const [breathingSessions, setBreathingSessions] = useState<BreathingSession[]>([]);

  const loadInsightsData = useCallback(async () => {
    const userId = user?.id || 'guest_user';
    try {
      const [fetchedSummary, fetchedRecent, fetchedStats, fetchedSessions] = await Promise.all([
        moodService.getWellnessJourneySummary(userId),
        moodService.getRecentMoodEntries(userId, 7),
        breathingService.getBreathingStats(userId),
        breathingService.getBreathingSessions(userId),
      ]);
      setSummary(fetchedSummary);
      setRecentMoods(fetchedRecent);
      setBreathingStats(fetchedStats);
      setBreathingSessions(fetchedSessions.slice(0, 5));
    } catch (err) {
      console.warn('[InsightsScreen] Failed to load insights data:', err);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadInsightsData();
    }, [loadInsightsData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInsightsData();
    } finally {
      setRefreshing(false);
    }
  }, [loadInsightsData]);

  const hasData = (summary && summary.totalEntries > 0) || (breathingStats && breathingStats.totalSessionsCompleted > 0);

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
        <SolaceHeader
          title="Wellness Insights"
          subtitle="Understanding your emotional rhythms & mindful practice"
        />

        {/* Overview Metric Row */}
        <View style={styles.metricsRow}>
          <View
            style={[
              styles.statBox,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Text style={styles.statEmoji}>✦</Text>
            <Text style={[styles.statNumber, { color: themeColors.primary }]}>
              {summary ? summary.totalEntries : 0}
            </Text>
            <Text style={[styles.statDesc, { color: themeColors.textSecondary }]}>
              Total Check-ins
            </Text>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Text style={styles.statEmoji}>🌬️</Text>
            <Text style={[styles.statNumber, { color: themeColors.primary }]}>
              {breathingStats ? breathingStats.totalMinutesBreathed : 0}m
            </Text>
            <Text style={[styles.statDesc, { color: themeColors.textSecondary }]}>
              Mindful Breath
            </Text>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
              Shadows.card,
            ]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statNumber, { color: themeColors.primary }]}>
              {summary ? summary.currentStreak : 0}
            </Text>
            <Text style={[styles.statDesc, { color: themeColors.textSecondary }]}>
              Day Streak
            </Text>
          </View>
        </View>

        {/* Empty State */}
        {!hasData ? (
          <SolaceCard variant="elevated" style={styles.card}>
            <Text style={[styles.cardTitle, { color: themeColors.primary }]}>
              Your Emotional Patterns
            </Text>
            <Text style={[styles.cardBody, { color: themeColors.textSecondary }]}>
              As you record daily check-ins and practice guided breathwork, your weekly reflection rhythms and calmness trends will emerge here.
            </Text>
            <View style={styles.emptyActionRow}>
              <Pressable
                onPress={() => router.push('/mood-check-in')}
                style={[styles.actionChip, { backgroundColor: themeColors.primary }]}>
                <Text style={[styles.actionChipText, { color: themeColors.onPrimary }]}>+ Check in now</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/breathing')}
                style={[styles.actionChipSec, { backgroundColor: themeColors.secondary, borderColor: themeColors.border }]}>
                <Text style={[styles.actionChipSecText, { color: themeColors.primary }]}>
                  + Take a breath
                </Text>
              </Pressable>
            </View>
          </SolaceCard>
        ) : (
          <>
            {/* Dominant Feeling / Mood Frequency */}
            <SolaceCard variant="elevated" style={styles.card}>
              <Text style={[styles.cardTitle, { color: themeColors.primary }]}>
                Dominant Rhythm
              </Text>
              <View style={[styles.dominantBadge, { backgroundColor: themeColors.blush }]}>
                <Text style={[styles.dominantValue, { color: themeColors.primary }]}>
                  {summary && summary.dominantMood ? `${summary.dominantMood.toUpperCase()}` : 'GENTLE REFLECTION'}
                </Text>
              </View>
              <Text style={[styles.cardBody, { color: themeColors.textSecondary }]}>
                Based on your recent check-in moments, this is your most frequent state of mind.
              </Text>
            </SolaceCard>

            {/* Mindful Breathwork Practice Card */}
            <SolaceCard variant="tinted" style={styles.card}>
              <Text style={[styles.cardTitle, { color: themeColors.primary }]}>
                Breathwork Practice
              </Text>
              <Text style={[styles.cardBody, { color: themeColors.textSecondary }]}>
                {breathingStats && breathingStats.totalSessionsCompleted > 0
                  ? `You have completed ${breathingStats.totalSessionsCompleted} breathing sessions (${breathingStats.totalMinutesBreathed} total minutes) in your sanctuary.`
                  : 'No breathing sessions completed yet.'}
              </Text>

              {breathingSessions.length > 0 && (
                <View style={styles.recentSessionsList}>
                  <Text style={[styles.sessionSubheading, { color: themeColors.textSecondary }]}>
                    RECENT SESSIONS
                  </Text>
                  {breathingSessions.map((s) => (
                    <View key={s.id} style={styles.sessionItem}>
                      <Text style={styles.sessionIcon}>🌬️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sessionName, { color: themeColors.text }]}>
                          {s.patternName}
                        </Text>
                        <Text style={[styles.sessionMeta, { color: themeColors.textSecondary }]}>
                          {s.completedCycles} cycles • {Math.round(s.completedDurationSeconds / 60)} min
                        </Text>
                      </View>
                      <Text style={[styles.sessionDate, { color: themeColors.textMuted }]}>
                        {new Date(s.completedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </SolaceCard>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xl + 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: Spacing.marginMobile,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  statNumber: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  statDesc: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: Spacing.marginMobile,
    marginTop: Spacing.md,
  },
  cardTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  dominantBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    marginTop: 8,
    marginBottom: 4,
  },
  dominantValue: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  cardBody: {
    ...Typography.bodyMd,
    marginTop: Spacing.xs,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 20,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  actionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
  },
  actionChipText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
  },
  actionChipSec: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
  },
  actionChipSecText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 12,
  },
  recentSessionsList: {
    marginTop: Spacing.md,
    gap: 8,
  },
  sessionSubheading: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  sessionIcon: {
    fontSize: 16,
  },
  sessionName: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 13,
  },
  sessionMeta: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 11,
  },
  sessionDate: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 11,
  },
});
