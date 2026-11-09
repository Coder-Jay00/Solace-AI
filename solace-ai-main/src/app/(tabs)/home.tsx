/**
 * Solace AI - Home Dashboard Screen
 * Phase 5: Home Dashboard & Mood Check-in
 *
 * Faithfully matches Google Stitch design:
 * solace-design-reference/home/
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/solace';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { moodService } from '@/services/moodService';
import { breathingService } from '@/services/breathingService';
import {
  MoodType,
  MOOD_OPTIONS,
  MoodEntry,
  WellnessJourneySummary,
} from '@/types/mood';
import { BreathingStats } from '@/types/breathingSession';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function HomeScreen() {
  const { themeColors } = useTheme();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [summary, setSummary] = useState<WellnessJourneySummary | null>(null);
  const [breathingStats, setBreathingStats] = useState<BreathingStats | null>(null);
  const [selectedQuickMood, setSelectedQuickMood] = useState<MoodType | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ moodLabel: string; moodType: MoodType } | null>(null);
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [quoteLiked, setQuoteLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(142);

  const lastTapTimeRef = useRef<number>(0);

  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const sanctuaryPeriod = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning Sanctuary';
    if (hour < 17) return 'Afternoon Sanctuary';
    return 'Evening Sanctuary';
  }, []);

  const currentTimeBadge = useMemo(() => {
    const d = new Date();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }, []);

  // Fetch real data on focus
  const loadDashboardData = useCallback(async () => {
    const userId = user?.id || 'guest_user';
    try {
      const [fetchedEntries, fetchedSummary, fetchedBreathing] = await Promise.all([
        moodService.getRecentMoodEntries(userId, 5),
        moodService.getWellnessJourneySummary(userId),
        breathingService.getBreathingStats(userId),
      ]);
      setEntries(fetchedEntries);
      setSummary(fetchedSummary);
      setBreathingStats(fetchedBreathing);

      if (fetchedEntries.length > 0) {
        // If entry was recorded today, highlight its mood
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEntry = fetchedEntries.find(
          (e) => e.createdAt.split('T')[0] === todayStr
        );
        if (todayEntry) {
          setSelectedQuickMood(todayEntry.mood);
        }
      }
    } catch (error) {
      console.warn('[HomeScreen] Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData]);

  const handleQuickMoodSelect = async (moodType: MoodType) => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 700 || isQuickSaving) {
      return; // debounced to prevent duplicate submissions
    }
    lastTapTimeRef.current = now;

    const option = MOOD_OPTIONS.find((o) => o.type === moodType);
    if (!option) return;

    setSelectedQuickMood(moodType);
    setFeedbackBanner({ moodLabel: option.label, moodType });
    setIsQuickSaving(true);

    const userId = user?.id || 'guest_user';
    try {
      await moodService.saveMoodEntry(userId, {
        userId,
        mood: moodType,
        moodLabel: option.label,
        emoji: option.emoji,
        energyLevel: 3,
        energyLabel: '3 • Noticeable wave',
        nuanceTags: option.defaultNuances.slice(0, 1),
        contextTags: ['#Home'],
      });
      await loadDashboardData();
    } catch (err) {
      console.warn('[HomeScreen] Quick save mood error:', err);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleToggleLike = () => {
    setQuoteLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => (next ? c + 1 : c - 1));
      return next;
    });
  };

  const latestEntry = entries.length > 0 ? entries[0] : null;

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
        {/* 1. Welcoming Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTextGroup}>
            <View style={styles.sanctuaryTagRow}>
              <View style={[styles.pulseDot, { backgroundColor: themeColors.secondaryContainer }]} />
              <Text style={[styles.sanctuaryTag, { color: themeColors.secondary }]}>
                {sanctuaryPeriod.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.greetingHeadline, { color: themeColors.primary }]}>
              {greetingTime}, {user?.name?.split(' ')[0] || user?.name || 'friend'}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: themeColors.textSecondary }]}>
              Take a deep breath. You are safe here.
            </Text>
          </View>

          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: themeColors.surfaceHigh, overflow: 'hidden' },
              Shadows.card,
            ]}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarIcon}>🌿</Text>
            )}
          </View>
        </View>

        {/* 2. Daily Mood Check-In Card */}
        <View
          style={[
            styles.moodCheckInCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
            Shadows.card,
          ]}>
          <View style={styles.moodCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.moodCardTitle, { color: themeColors.primary }]}>
                How are you feeling today?
              </Text>
              <Text style={[styles.moodCardSubtitle, { color: themeColors.textSecondary }]}>
                Tap to gently anchor this moment
              </Text>
            </View>
            <View style={[styles.timePill, { backgroundColor: themeColors.surfaceLow }]}>
              <Text style={[styles.timePillText, { color: themeColors.secondary }]}>
                {currentTimeBadge}
              </Text>
            </View>
          </View>

          {/* 5 Quick Mood Buttons */}
          <View style={styles.moodSelectorRow}>
            {MOOD_OPTIONS.map((option) => {
              const isSelected = selectedQuickMood === option.type;
              return (
                <Pressable
                  key={option.type}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option.label}`}
                  onPress={() => handleQuickMoodSelect(option.type)}
                  style={({ pressed }) => [
                    styles.quickMoodBtn,
                    isSelected && {
                      backgroundColor: themeColors.surfaceHigh,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.quickMoodIconCircle,
                      {
                        backgroundColor: isSelected
                          ? themeColors.primaryContainer
                          : themeColors.surfaceLow,
                      },
                      isSelected && Shadows.glow,
                    ]}>
                    <Text style={styles.quickMoodEmoji}>{option.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.quickMoodLabel,
                      {
                        color: isSelected ? themeColors.primary : themeColors.textSecondary,
                        fontFamily: isSelected
                          ? FontFamilies.sans.bold
                          : FontFamilies.sans.regular,
                      },
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quick Saving Indicator */}
          {isQuickSaving && (
            <View style={[styles.savingIndicatorRow, { backgroundColor: themeColors.surfaceLow }]}>
              <ActivityIndicator size="small" color={themeColors.primary} />
              <Text style={[styles.savingText, { color: themeColors.textSecondary }]}>
                Recording your check-in...
              </Text>
            </View>
          )}

          {/* Feedback Card / Toast */}
          {feedbackBanner ? (
            <View
              style={[
                styles.feedbackToastCard,
                { backgroundColor: themeColors.blush, borderColor: themeColors.border },
              ]}>
              <View style={styles.feedbackToastHeader}>
                <Text style={[styles.feedbackCheckmark, { color: themeColors.primary }]}>✓</Text>
                <Text style={[styles.feedbackToastText, { color: themeColors.text }]}>
                  You selected{' '}
                  <Text style={{ fontFamily: FontFamilies.sans.bold, color: themeColors.primary }}>
                    {feedbackBanner.moodLabel}
                  </Text>
                  . Thank you for checking in with yourself.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add reflection and notes"
                onPress={() =>
                  router.push({
                    pathname: '/mood-check-in',
                    params: { initialMood: feedbackBanner.moodType },
                  })
                }
                style={({ pressed }) => [
                  styles.feedbackActionLink,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.feedbackActionText, { color: themeColors.primary }]}>
                  Add reflection & notes →
                </Text>
              </Pressable>
            </View>
          ) : latestEntry ? (
            <View style={styles.moodFeedbackRow}>
              <View
                style={[
                  styles.verifiedFeedbackPill,
                  { backgroundColor: themeColors.secondary },
                ]}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={[styles.verifiedText, { color: themeColors.textSecondary }]}>
                  Feeling <Text style={{ fontFamily: FontFamilies.sans.bold, color: themeColors.primary }}>{latestEntry.moodLabel}</Text> — recorded for your weekly rhythm
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/mood-check-in',
                    params: selectedQuickMood ? { initialMood: selectedQuickMood } : undefined,
                  })
                }
                style={({ pressed }) => [
                  styles.detailedCheckInLink,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.detailedCheckInText, { color: themeColors.primary }]}>
                  Add reflection & notes →
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/mood-check-in')}
              style={({ pressed }) => [
                styles.openCheckInBtn,
                { backgroundColor: themeColors.secondary },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.openCheckInBtnText, { color: themeColors.primary }]}>
                Open full check-in with journal notes →
              </Text>
            </Pressable>
          )}
        </View>

        {/* 3. Companion Highlight Card (Talk to Solace) */}
        <View
          style={[
            styles.companionHeroCard,
            {
              backgroundColor: themeColors.secondary,
              borderColor: themeColors.border,
            },
            Shadows.card,
          ]}>
          <View style={styles.companionStatusRow}>
            <View style={[styles.onlineBadge, { backgroundColor: themeColors.surfaceElevated }]}>
              <View style={[styles.onlinePingDot, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.onlineBadgeText, { color: themeColors.primary }]}>
                Solace Companion • Present
              </Text>
            </View>
            <View style={[styles.waveformCircle, { backgroundColor: themeColors.surfaceElevated }]}>
              <Text style={[styles.waveformIcon, { color: themeColors.primary }]}>🌿</Text>
            </View>
          </View>

          <Text style={[styles.companionHeadline, { color: themeColors.text }]}>
            "I'm here whenever you need me."
          </Text>
          <Text style={[styles.companionSubtext, { color: themeColors.textSecondary }]}>
            Whether you need to untangle racing thoughts, vent quietly, or find gentle grounding in this moment.
          </Text>

          <View style={styles.companionActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Talk to Solace"
              onPress={() => router.push('/(tabs)/companion')}
              style={({ pressed }) => [
                styles.talkToSolaceBtn,
                { backgroundColor: themeColors.primary },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.talkToSolaceIcon}>💬</Text>
              <Text style={[styles.talkToSolaceText, { color: themeColors.onPrimary }]}>
                Talk to Solace
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quick voice check-in"
              onPress={() => router.push('/(tabs)/companion')}
              style={({ pressed }) => [
                styles.voicePillBtn,
                { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.voicePillIcon, { color: themeColors.primary }]}>🎙️</Text>
            </Pressable>
          </View>
        </View>

        {/* 4. Daily Affirmation Card */}
        <View
          style={[
            styles.affirmationCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
            Shadows.card,
          ]}>
          <View style={styles.affirmationHeader}>
            <Text style={[styles.affirmationTag, { color: themeColors.secondary }]}>
              DAILY INTENTION
            </Text>
            <View style={styles.curatedRow}>
              <Text style={styles.curatedIcon}>✨</Text>
              <Text style={[styles.curatedText, { color: themeColors.textMuted }]}>
                Curated for {user?.name || 'Maya'}
              </Text>
            </View>
          </View>

          <Text style={[styles.affirmationQuote, { color: themeColors.text }]}>
            "You deserve the same kindness you give so freely to others."
          </Text>

          <View style={styles.affirmationFooter}>
            <View style={styles.quoteInteractions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Like daily intention"
                onPress={handleToggleLike}
                style={({ pressed }) => [
                  styles.likeButton,
                  { backgroundColor: themeColors.surfaceLow },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.likeHeart, { color: quoteLiked ? themeColors.primary : themeColors.secondary }]}>
                  {quoteLiked ? '♥' : '♡'}
                </Text>
                <Text style={[styles.likeCountText, { color: themeColors.textSecondary }]}>
                  {likeCount}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bookmark quote"
                style={({ pressed }) => [
                  styles.bookmarkButton,
                  { backgroundColor: themeColors.surfaceLow },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.bookmarkIcon, { color: themeColors.textSecondary }]}>🔖</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/mood-check-in')}
              style={({ pressed }) => [
                styles.reflectSaveBtn,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.reflectSaveText, { color: themeColors.primary }]}>
                Reflect & Save →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 5. Mindful Practices Quick Hub */}
        <View style={styles.practicesSection}>
          <View style={styles.practicesHeader}>
            <View>
              <Text style={[styles.practicesTitle, { color: themeColors.primary }]}>
                Mindful Practices
              </Text>
              <Text style={[styles.practicesSubtitle, { color: themeColors.textSecondary }]}>
                Micro-pauses for your day
              </Text>
            </View>
            <Text style={[styles.seeAllText, { color: themeColors.secondary }]}>
              See all (3)
            </Text>
          </View>

          <View style={styles.practiceList}>
            {/* Guided Breathing */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start Guided Breathing exercise"
              onPress={() => router.push('/breathing')}
              style={({ pressed }) => [
                styles.practiceItem,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
                pressed && styles.pressed,
              ]}>
              <View style={styles.practiceLeft}>
                <View
                  style={[
                    styles.practiceIconWrapper,
                    { backgroundColor: themeColors.surfaceHigh },
                  ]}>
                  <Text style={styles.practiceIcon}>🌬️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.practiceTitleRow}>
                    <Text style={[styles.practiceName, { color: themeColors.text }]}>
                      Guided Breathing
                    </Text>
                    <View style={[styles.practiceDurationBadge, { backgroundColor: themeColors.surfaceLow }]}>
                      <Text style={[styles.practiceDurationText, { color: themeColors.secondary }]}>
                        {breathingStats && breathingStats.totalMinutesBreathed > 0
                          ? `${breathingStats.totalMinutesBreathed} min breathed`
                          : '3 min'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.practiceDesc, { color: themeColors.textSecondary }]}>
                    {breathingStats && breathingStats.lastSession
                      ? `Last: ${breathingStats.lastSession.patternName}`
                      : 'Find your calm with Box Breathing'}
                  </Text>
                </View>
              </View>
              <View style={[styles.playButtonCircle, { backgroundColor: themeColors.surfaceLow }]}>
                <Text style={[styles.playArrow, { color: themeColors.primary }]}>▶</Text>
              </View>
            </Pressable>

            {/* Daily Reflection */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start Daily Reflection"
              onPress={() => router.push('/mood-check-in')}
              style={({ pressed }) => [
                styles.practiceItem,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
                pressed && styles.pressed,
              ]}>
              <View style={styles.practiceLeft}>
                <View
                  style={[
                    styles.practiceIconWrapper,
                    { backgroundColor: themeColors.surfaceLow },
                  ]}>
                  <Text style={styles.practiceIcon}>✍️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.practiceTitleRow}>
                    <Text style={[styles.practiceName, { color: themeColors.text }]}>
                      Daily Reflection
                    </Text>
                    <View style={[styles.practiceDurationBadge, { backgroundColor: themeColors.surfaceLow }]}>
                      <Text style={[styles.practiceDurationText, { color: themeColors.secondary }]}>
                        5 min
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.practiceDesc, { color: themeColors.textSecondary }]}>
                    Mindful thoughts & gratitude prompt
                  </Text>
                </View>
              </View>
              <View style={[styles.playButtonCircle, { backgroundColor: themeColors.surfaceLow }]}>
                <Text style={[styles.playArrow, { color: themeColors.primary }]}>▶</Text>
              </View>
            </Pressable>

            {/* Body Scan */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start Body Scan meditation"
              onPress={() => router.push('/breathing')}
              style={({ pressed }) => [
                styles.practiceItem,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
                pressed && styles.pressed,
              ]}>
              <View style={styles.practiceLeft}>
                <View
                  style={[
                    styles.practiceIconWrapper,
                    { backgroundColor: themeColors.surfaceHigh },
                  ]}>
                  <Text style={styles.practiceIcon}>🧘</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.practiceTitleRow}>
                    <Text style={[styles.practiceName, { color: themeColors.text }]}>
                      Body Scan Meditation
                    </Text>
                    <View style={[styles.practiceDurationBadge, { backgroundColor: themeColors.surfaceLow }]}>
                      <Text style={[styles.practiceDurationText, { color: themeColors.secondary }]}>
                        10 min
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.practiceDesc, { color: themeColors.textSecondary }]}>
                    Release tension from shoulders & jaw
                  </Text>
                </View>
              </View>
              <View style={[styles.playButtonCircle, { backgroundColor: themeColors.surfaceLow }]}>
                <Text style={[styles.playArrow, { color: themeColors.primary }]}>▶</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 6. Weekly Progress & Streak Section */}
        <View
          style={[
            styles.journeyCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
            Shadows.card,
          ]}>
          <View style={styles.journeyHeader}>
            <View>
              <Text style={[styles.journeyTitle, { color: themeColors.primary }]}>
                Your Wellness Journey
              </Text>
              <Text style={[styles.journeySubtitle, { color: themeColors.textSecondary }]}>
                Consistency brings peace
              </Text>
            </View>

            <View style={[styles.streakBadge, { backgroundColor: themeColors.surfaceHigh }]}>
              <Text style={styles.streakFlameIcon}>🔥</Text>
              <Text style={[styles.streakCountText, { color: themeColors.primary }]}>
                {summary ? `${summary.streakDays}-Day Streak` : '0-Day Streak'}
              </Text>
            </View>
          </View>

          {/* 7-Day Pill Timeline */}
          <View style={styles.timelineRow}>
            {summary?.weekTimeline.map((day, idx) => {
              return (
                <View key={idx} style={styles.timelineDayCol}>
                  <Text
                    style={[
                      styles.timelineDayLetter,
                      {
                        color: day.isToday ? themeColors.primary : themeColors.textMuted,
                        fontFamily: day.isToday
                          ? FontFamilies.sans.bold
                          : FontFamilies.sans.medium,
                      },
                    ]}>
                    {day.dayLetter}
                  </Text>
                  <View
                    style={[
                      styles.timelinePill,
                      {
                        backgroundColor: day.isToday
                          ? themeColors.primaryContainer
                          : day.hasEntry
                          ? themeColors.surfaceHigh
                          : themeColors.surfaceLow,
                      },
                      day.isToday && Shadows.glow,
                    ]}>
                    {day.hasEntry ? (
                      <Text style={[styles.timelineCheck, { color: day.isToday ? '#FFFFFF' : themeColors.secondary }]}>
                        {day.primaryEmoji || '✓'}
                      </Text>
                    ) : (
                      <View style={[styles.emptyDayDot, { backgroundColor: themeColors.border }]} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Weekly Rhythm Micro Summary */}
          <View style={[styles.rhythmSummaryPill, { backgroundColor: themeColors.surfaceLow }]}>
            <View style={styles.rhythmIconRow}>
              <Text style={styles.rhythmIcon}>📊</Text>
              <Text style={[styles.rhythmText, { color: themeColors.textSecondary }]}>
                Predominant emotional state:
              </Text>
            </View>
            <Text style={[styles.rhythmValue, { color: themeColors.primary }]}>
              {summary?.predominantMood || 'Awaiting first check-in'}
            </Text>
          </View>
        </View>

        {/* 7. Recent Mood Activity Log / Encouraging Empty State */}
        <View style={styles.recentActivitySection}>
          <Text style={[styles.recentActivityTitle, { color: themeColors.primary }]}>
            Recent Reflections
          </Text>

          {isLoading ? (
            <ActivityIndicator style={{ paddingVertical: 20 }} color={themeColors.primary} />
          ) : entries.length === 0 ? (
            /* Thoughtful Empty State (Zero fabrication) */
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}>
              <View style={[styles.emptyStateIconCircle, { backgroundColor: themeColors.surfaceLow }]}>
                <Text style={styles.emptyStateLotus}>🌿</Text>
              </View>
              <Text style={[styles.emptyStateTitle, { color: themeColors.primary }]}>
                No check-ins yet today
              </Text>
              <Text style={[styles.emptyStateBody, { color: themeColors.textSecondary }]}>
                Your sanctuary journey begins with a single mindful pause. Take a moment to anchor how you are feeling right now.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/mood-check-in')}
                style={({ pressed }) => [
                  styles.emptyStateButton,
                  { backgroundColor: themeColors.primaryContainer },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.emptyStateButtonText}>Log First Check-in</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {entries.map((entry) => {
                const dateObj = new Date(entry.createdAt);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.entryCard,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                      },
                      Shadows.card,
                    ]}>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryMoodInfo}>
                        <View style={[styles.entryEmojiCircle, { backgroundColor: themeColors.surfaceLow }]}>
                          <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                        </View>
                        <View>
                          <Text style={[styles.entryMoodLabel, { color: themeColors.primary }]}>
                            {entry.moodLabel}
                          </Text>
                          <Text style={[styles.entryTimestamp, { color: themeColors.textMuted }]}>
                            {dateStr} • {timeStr}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.entryIntensityPill, { backgroundColor: themeColors.surfaceLow }]}>
                        <Text style={[styles.entryIntensityText, { color: themeColors.secondary }]}>
                          Level {entry.energyLevel}/5
                        </Text>
                      </View>
                    </View>

                    {entry.note ? (
                      <Text
                        numberOfLines={2}
                        style={[styles.entryNote, { color: themeColors.text }]}>
                        "{entry.note}"
                      </Text>
                    ) : null}

                    {entry.nuanceTags && entry.nuanceTags.length > 0 && (
                      <View style={styles.entryTagsRow}>
                        {entry.nuanceTags.map((t, idx) => (
                          <View key={idx} style={[styles.tagMiniPill, { backgroundColor: themeColors.surfaceLow }]}>
                            <Text style={[styles.tagMiniText, { color: themeColors.textSecondary }]}>
                              {t}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl + 40,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  sanctuaryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sanctuaryTag: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.5,
  },
  greetingHeadline: {
    ...Typography.headlineLgMobile,
    fontFamily: FontFamilies.serif.medium,
  },
  greetingSubtitle: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    marginTop: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarIcon: {
    fontSize: 24,
  },
  moodCheckInCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  moodCardTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  moodCardSubtitle: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    marginTop: 2,
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  timePillText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.semiBold,
  },
  moodSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: Spacing.md,
  },
  quickMoodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: Radii.sm,
  },
  quickMoodIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickMoodEmoji: {
    fontSize: 22,
  },
  quickMoodLabel: {
    fontSize: 11,
  },
  moodFeedbackRow: {
    gap: 8,
    marginTop: 4,
  },
  savingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    marginTop: 4,
  },
  savingText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 12,
  },
  feedbackToastCard: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginTop: 6,
    gap: 6,
  },
  feedbackToastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackCheckmark: {
    fontSize: 15,
    fontFamily: FontFamilies.sans.bold,
  },
  feedbackToastText: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  feedbackActionLink: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  feedbackActionText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  verifiedFeedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    gap: 6,
  },
  verifiedIcon: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.regular,
    flex: 1,
  },
  detailedCheckInLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  detailedCheckInText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.bold,
  },
  openCheckInBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openCheckInBtnText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.semiBold,
  },
  companionHeroCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  companionStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    gap: 6,
  },
  onlinePingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#81C784',
  },
  onlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamilies.sans.medium,
  },
  waveformCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformIcon: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  companionHeadline: {
    ...Typography.headlineMd,
    fontFamily: FontFamilies.serif.medium,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  companionSubtext: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  companionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  talkToSolaceBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  talkToSolaceIcon: {
    fontSize: 16,
  },
  talkToSolaceText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamilies.sans.bold,
  },
  voicePillBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePillIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  affirmationCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  affirmationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  affirmationTag: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.5,
  },
  curatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  curatedIcon: {
    fontSize: 11,
  },
  curatedText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.medium,
  },
  affirmationQuote: {
    ...Typography.headlineMd,
    fontFamily: FontFamilies.serif.medium,
    lineHeight: 30,
    marginBottom: Spacing.md,
  },
  affirmationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteInteractions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    gap: 4,
  },
  likeHeart: {
    fontSize: 14,
  },
  likeCountText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    fontSize: 13,
  },
  reflectSaveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  reflectSaveText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.bold,
  },
  practicesSection: {
    marginBottom: Spacing.lg,
  },
  practicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  practicesTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  practicesSubtitle: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.bold,
  },
  practiceList: {
    gap: 10,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  practiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  practiceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceIcon: {
    fontSize: 20,
  },
  practiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  practiceName: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.semiBold,
  },
  practiceDurationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  practiceDurationText: {
    fontSize: 10,
    fontFamily: FontFamilies.sans.bold,
  },
  practiceDesc: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.regular,
    marginTop: 2,
  },
  playButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  playArrow: {
    fontSize: 12,
    marginLeft: 2,
  },
  journeyCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  journeyTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  journeySubtitle: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    gap: 4,
  },
  streakFlameIcon: {
    fontSize: 13,
  },
  streakCountText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.bold,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: Spacing.md,
  },
  timelineDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  timelineDayLetter: {
    fontSize: 12,
  },
  timelinePill: {
    width: 34,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCheck: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rhythmSummaryPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  rhythmIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rhythmIcon: {
    fontSize: 13,
  },
  rhythmText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.regular,
  },
  rhythmValue: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.bold,
  },
  recentActivitySection: {
    marginBottom: Spacing.md,
  },
  recentActivityTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
    marginBottom: Spacing.sm,
  },
  emptyStateCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyStateIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyStateLotus: {
    fontSize: 26,
  },
  emptyStateTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
    marginBottom: 6,
  },
  emptyStateBody: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.full,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FontFamilies.sans.bold,
  },
  entriesList: {
    gap: 10,
  },
  entryCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryMoodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryEmojiCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryEmoji: {
    fontSize: 18,
  },
  entryMoodLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
  entryTimestamp: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
  },
  entryIntensityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  entryIntensityText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.semiBold,
  },
  entryNote: {
    fontSize: 13,
    fontFamily: FontFamilies.serif.regular,
    lineHeight: 18,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  entryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  tagMiniText: {
    fontSize: 10,
    fontFamily: FontFamilies.sans.medium,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
