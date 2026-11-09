/**
 * Solace AI - Daily Mood Check-In Screen
 * Phase 5: Home Dashboard & Mood Check-in
 *
 * Faithfully matches Google Stitch design:
 * solace-design-reference/daily_mood_check_in/
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { moodService } from '@/services/moodService';
import {
  MoodType,
  MOOD_OPTIONS,
  INTENSITY_LEVELS,
  CONTEXT_TAG_SUGGESTIONS,
} from '@/types/mood';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function MoodCheckInScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ initialMood?: MoodType }>();

  // Determine initial mood if passed from Home
  const defaultMoodType = (params.initialMood && ['happy', 'calm', 'neutral', 'sad', 'anxious'].includes(params.initialMood))
    ? params.initialMood
    : 'calm';

  const [selectedMood, setSelectedMood] = useState<MoodType>(defaultMoodType);
  const [selectedNuances, setSelectedNuances] = useState<string[]>(['Grounded']);
  const [intensity, setIntensity] = useState<number>(4);
  const [note, setNote] = useState<string>('');
  const [selectedContextTags, setSelectedContextTags] = useState<string[]>(['#Morning']);
  const [exploreReflections, setExploreReflections] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmationData, setConfirmationData] = useState<{
    moodLabel: string;
    streakDays: number;
  } | null>(null);

  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // Time formatted for top header
  const currentTimeString = useMemo(() => {
    const d = new Date();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }, []);

  const activeMoodOption = useMemo(() => {
    return MOOD_OPTIONS.find((o) => o.type === selectedMood) || MOOD_OPTIONS[1];
  }, [selectedMood]);

  const activeIntensityOption = useMemo(() => {
    return INTENSITY_LEVELS.find((i) => i.level === intensity) || INTENSITY_LEVELS[3];
  }, [intensity]);

  const handleSelectMood = (moodType: MoodType) => {
    setSelectedMood(moodType);
    setErrorMessage(null);
    // Reset nuance tags to default for this mood
    const option = MOOD_OPTIONS.find((o) => o.type === moodType);
    if (option && option.defaultNuances.length > 0) {
      setSelectedNuances([option.defaultNuances[0]]);
    } else {
      setSelectedNuances([]);
    }
  };

  const handleToggleNuance = (nuance: string) => {
    setSelectedNuances((prev) =>
      prev.includes(nuance)
        ? prev.filter((item) => item !== nuance)
        : [...prev, nuance]
    );
  };

  const handleToggleContextTag = (tag: string) => {
    setSelectedContextTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

  const handleSaveMood = async () => {
    if (!selectedMood) {
      setErrorMessage('Please select how you are feeling.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const userId = user?.id || 'guest_user';
      await moodService.saveMoodEntry(userId, {
        userId,
        mood: selectedMood,
        moodLabel: activeMoodOption.label,
        emoji: activeMoodOption.emoji,
        energyLevel: intensity,
        energyLabel: activeIntensityOption.label,
        nuanceTags: selectedNuances,
        contextTags: selectedContextTags,
        note: note.trim() || undefined,
      });

      // Fetch updated streak for the confirmation modal
      const summary = await moodService.getWellnessJourneySummary(userId);

      setConfirmationData({
        moodLabel: activeMoodOption.label,
        streakDays: summary.streakDays,
      });
    } catch (error) {
      console.error('[MoodCheckInScreen] Save failed:', error);
      setErrorMessage('Could not save your mood check-in. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        {/* Subtle Top Context & Dismiss Header */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to previous screen"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: themeColors.secondary },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.roundButtonText, { color: themeColors.text }]}>←</Text>
          </Pressable>

          <View style={[styles.timeBadge, { backgroundColor: themeColors.secondary }]}>
            <Text style={[styles.timeBadgeText, { color: themeColors.primary }]}>
              {currentTimeString} • Sanctuary Log
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close check-in"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: themeColors.secondary },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.roundButtonText, { color: themeColors.textSecondary }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Hero Prompt */}
          <View style={styles.heroSection}>
            <View style={styles.heroTagRow}>
              <View style={[styles.dotIndicator, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.heroTag, { color: themeColors.primary }]}>
                MOMENT OF PAUSE
              </Text>
            </View>
            <Text style={[styles.heroTitle, { color: themeColors.primary }]}>
              How are you feeling right now?
            </Text>
            <Text style={[styles.heroSubtitle, { color: themeColors.textSecondary }]}>
              Take a moment to check in with yourself. No pressure, zero judgment.
            </Text>
          </View>

          {errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: themeColors.errorContainer }]}>
              <Text style={[styles.errorText, { color: themeColors.error }]}>{errorMessage}</Text>
            </View>
          )}

          {/* Section 1: Mood Palette (Primary State) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
              PRIMARY STATE
            </Text>
            <Text style={[styles.sectionHint, { color: themeColors.primary }]}>
              Select one
            </Text>
          </View>

          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((option) => {
              const isSelected = selectedMood === option.type;
              return (
                <Pressable
                  key={option.type}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${option.label}, ${option.descriptor}`}
                  onPress={() => handleSelectMood(option.type)}
                  style={({ pressed }) => [
                    styles.moodItem,
                    {
                      backgroundColor: isSelected
                        ? themeColors.primary
                        : themeColors.surfaceElevated,
                      borderColor: isSelected
                        ? themeColors.primaryPressed
                        : themeColors.border,
                    },
                    isSelected && Shadows.card,
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.moodEmojiCircle,
                      {
                        backgroundColor: isSelected
                          ? themeColors.blush
                          : themeColors.secondary,
                      },
                    ]}>
                    <Text style={styles.moodEmoji}>{option.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.moodLabel,
                      {
                        color: isSelected ? themeColors.onPrimary : themeColors.text,
                        fontFamily: isSelected
                          ? FontFamilies.sans.bold
                          : FontFamilies.sans.medium,
                      },
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Nuanced Emotional Micro-tags */}
          <View style={styles.nuanceRow}>
            {activeMoodOption.defaultNuances.map((nuance) => {
              const isSelected = selectedNuances.includes(nuance);
              return (
                <Pressable
                  key={nuance}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => handleToggleNuance(nuance)}
                  style={({ pressed }) => [
                    styles.nuanceChip,
                    {
                      backgroundColor: isSelected
                        ? themeColors.primary
                        : themeColors.secondary,
                      borderColor: isSelected
                        ? themeColors.primary
                        : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.nuanceChipText,
                      {
                        color: isSelected ? themeColors.onPrimary : themeColors.textSecondary,
                        fontFamily: isSelected
                          ? FontFamilies.sans.semiBold
                          : FontFamilies.sans.medium,
                      },
                    ]}>
                    {nuance}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Section 2: Emotional Intensity Continuum */}
          <View
            style={[
              styles.cardSection,
              {
                backgroundColor: themeColors.surfaceElevated,
                borderColor: themeColors.border,
              },
            ]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: themeColors.primary }]}>
                Emotional Intensity
              </Text>
              <Text style={[styles.intensityBadgeText, { color: themeColors.primary }]}>
                {activeIntensityOption.label}
              </Text>
            </View>
            <Text style={[styles.cardSubtext, { color: themeColors.textSecondary }]}>
              From a fleeting whisper to a deeply resonant tide.
            </Text>

            {/* Track nodes */}
            <View style={styles.trackContainer}>
              <View
                style={[
                  styles.trackLineBackground,
                  { backgroundColor: themeColors.secondary },
                ]}
              />
              <View
                style={[
                  styles.trackLineFill,
                  {
                    backgroundColor: themeColors.primary,
                    width: `${((intensity - 1) / 4) * 85 + 5}%`,
                  },
                ]}
              />

              {INTENSITY_LEVELS.map((item) => {
                const isActive = item.level === intensity;
                return (
                  <Pressable
                    key={item.level}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => setIntensity(item.level)}
                    style={({ pressed }) => [
                      styles.intensityNode,
                      {
                        backgroundColor: isActive
                          ? themeColors.primary
                          : themeColors.surfaceElevated,
                        borderColor: isActive
                          ? themeColors.primary
                          : themeColors.border,
                      },
                      isActive && Shadows.glow,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.intensityNodeText,
                        {
                          color: isActive ? themeColors.onPrimary : themeColors.textSecondary,
                          fontFamily: isActive
                            ? FontFamilies.sans.bold
                            : FontFamilies.sans.medium,
                        },
                      ]}>
                      {item.level}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.trackFooterRow}>
              <Text style={[styles.trackFooterLabel, { color: themeColors.textMuted }]}>
                Gentle whisper
              </Text>
              <Text style={[styles.trackFooterLabel, { color: themeColors.textMuted }]}>
                Profound
              </Text>
            </View>
          </View>

          {/* Section 3: Mindful Reflection Card */}
          <View
            style={[
              styles.cardSection,
              {
                backgroundColor: themeColors.surfaceElevated,
                borderColor: themeColors.border,
              },
            ]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: themeColors.primary }]}>
                Reflection Note
              </Text>
              <Text style={[styles.privateBadge, { color: themeColors.textMuted }]}>
                Private space
              </Text>
            </View>
            <Text style={[styles.cardSubtext, { color: themeColors.textSecondary }]}>
              Write as much or as little as your heart seeks.
            </Text>

            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: themeColors.secondary },
              ]}>
              <TextInput
                style={[
                  styles.reflectionInput,
                  { color: themeColors.text },
                ]}
                placeholder="Feeling grateful for a quiet morning, but feeling a bit slow to warm up to today's creative tasks..."
                placeholderTextColor={themeColors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={300}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                <View style={styles.voiceStub}>
                  <Text style={[styles.voiceIcon, { color: themeColors.primary }]}>🎙️</Text>
                  <Text style={[styles.voiceLabel, { color: themeColors.textMuted }]}>
                    Private journal
                  </Text>
                </View>
                <Text style={[styles.charCounter, { color: themeColors.textMuted }]}>
                  {note.length}/300
                </Text>
              </View>
            </View>

            {/* Context Tags */}
            <View style={styles.contextTagsRow}>
              <Text style={[styles.contextTagPrefix, { color: themeColors.textMuted }]}>
                Context:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CONTEXT_TAG_SUGGESTIONS.map((tag) => {
                  const isSelected = selectedContextTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => handleToggleContextTag(tag)}
                      style={({ pressed }) => [
                        styles.contextTagChip,
                        {
                          backgroundColor: isSelected
                            ? themeColors.blush
                            : themeColors.secondary,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.contextTagChipText,
                          {
                            color: isSelected ? themeColors.primary : themeColors.textSecondary,
                            fontFamily: isSelected
                              ? FontFamilies.sans.bold
                              : FontFamilies.sans.medium,
                          },
                        ]}>
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Section 4: AI Companion Gentle Insight Card */}
          <View
            style={[
              styles.companionCard,
              {
                backgroundColor: themeColors.secondary,
                borderColor: themeColors.border,
              },
            ]}>
            <View style={styles.companionCardContent}>
              <View
                style={[
                  styles.companionAvatar,
                  { backgroundColor: themeColors.blush },
                ]}>
                <Text style={[styles.companionAvatarIcon, { color: themeColors.primary }]}>✦</Text>
              </View>

              <View style={styles.companionDetails}>
                <View style={styles.companionBadgeRow}>
                  <Text style={[styles.companionTitle, { color: themeColors.primary }]}>
                    Solace is listening
                  </Text>
                  <View
                    style={[
                      styles.careBadge,
                      { backgroundColor: themeColors.blush },
                    ]}>
                    <Text style={[styles.careBadgeText, { color: themeColors.primary }]}>
                      ACTIVE CARE
                    </Text>
                  </View>
                </View>

                <Text style={[styles.companionBody, { color: themeColors.textSecondary }]}>
                  I will gently anchor this moment and integrate this{' '}
                  <Text style={{ fontFamily: FontFamilies.sans.bold, color: themeColors.primary }}>
                    {activeMoodOption.label.toLowerCase()}
                  </Text>{' '}
                  sentiment into your weekly sanctuary balance report.
                </Text>

                <Pressable
                  onPress={() => setExploreReflections(!exploreReflections)}
                  style={styles.reflectionToggleRow}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: exploreReflections
                          ? themeColors.primary
                          : themeColors.border,
                        backgroundColor: exploreReflections
                          ? themeColors.primary
                          : 'transparent',
                      },
                    ]}>
                    {exploreReflections && <Text style={[styles.checkboxCheck, { color: themeColors.onPrimary }]}>✓</Text>}
                  </View>
                  <Text style={[styles.toggleText, { color: themeColors.text }]}>
                    Explore personalized reflections right after saving
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Section 5: Primary Commit Action */}
          <View style={styles.commitSection}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save my mood"
              disabled={isSaving}
              onPress={handleSaveMood}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: themeColors.primary },
                Shadows.floating,
                pressed && styles.pressed,
                isSaving && { opacity: 0.7 },
              ]}>
              {isSaving ? (
                <ActivityIndicator color={themeColors.onPrimary} size="small" />
              ) : (
                <>
                  <Text style={[styles.saveButtonText, { color: themeColors.onPrimary }]}>Save my mood</Text>
                  <Text style={[styles.saveButtonArrow, { color: themeColors.onPrimary }]}>→</Text>
                </>
              )}
            </Pressable>
            <Text style={[styles.commitFootnote, { color: themeColors.textMuted }]}>
              Logs count towards your mindful sanctuary rhythm
            </Text>
          </View>
        </ScrollView>

        {/* Confirmation Modal Sheet */}
        <Modal
          visible={Boolean(confirmationData)}
          transparent
          animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: themeColors.surfaceElevated },
                Shadows.floating,
              ]}>
              <View
                style={[
                  styles.modalIconCircle,
                  { backgroundColor: themeColors.blush },
                ]}>
                <Text style={styles.modalLotusIcon}>🌿</Text>
              </View>

              <Text style={[styles.modalTag, { color: themeColors.primary }]}>
                MOOD RECORDED
              </Text>
              <Text style={[styles.modalTitle, { color: themeColors.primary }]}>
                Presence acknowledged.
              </Text>
              <Text style={[styles.modalBody, { color: themeColors.textSecondary }]}>
                Your <Text style={{ fontFamily: FontFamilies.sans.bold, color: themeColors.text }}>{confirmationData?.moodLabel}</Text> state was gently anchored into your Sanctuary rhythm. Your streak is now{' '}
                <Text style={{ fontFamily: FontFamilies.sans.bold, color: themeColors.primary }}>
                  {confirmationData?.streakDays || 1} {confirmationData?.streakDays === 1 ? 'day' : 'days'}
                </Text>.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setConfirmationData(null);
                    router.replace('/breathing');
                  }}
                  style={({ pressed }) => [
                    styles.modalPrimaryButton,
                    { backgroundColor: themeColors.primary },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.modalPrimaryButtonIcon}>🧘</Text>
                  <Text style={[styles.modalPrimaryButtonText, { color: themeColors.onPrimary }]}>
                    Start 2-min Grounding Breath
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setConfirmationData(null);
                    router.back();
                  }}
                  style={({ pressed }) => [
                    styles.modalSecondaryButton,
                    { backgroundColor: themeColors.secondary },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.modalSecondaryButtonText, { color: themeColors.primary }]}>
                    Return to Sanctuary
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.xs,
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  timeBadgeText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl + 20,
  },
  heroSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroTag: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.5,
  },
  heroTitle: {
    ...Typography.headlineLgMobile,
    fontFamily: FontFamilies.serif.medium,
  },
  heroSubtitle: {
    ...Typography.bodyMd,
    fontFamily: FontFamilies.sans.regular,
    marginTop: 4,
    lineHeight: 22,
  },
  errorBanner: {
    padding: Spacing.md,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.medium,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  moodEmojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
  nuanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  nuanceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  nuanceChipText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  cardSection: {
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  intensityBadgeText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.semiBold,
  },
  cardSubtext: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    marginBottom: Spacing.md,
  },
  trackContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trackLineBackground: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 4,
    borderRadius: 2,
  },
  trackLineFill: {
    position: 'absolute',
    left: 20,
    height: 4,
    borderRadius: 2,
  },
  intensityNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 2,
  },
  intensityNodeText: {
    fontSize: 13,
  },
  trackFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingHorizontal: 4,
  },
  trackFooterLabel: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
  },
  privateBadge: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
  },
  inputWrapper: {
    borderRadius: Radii.sm,
    padding: 12,
  },
  reflectionInput: {
    minHeight: 70,
    fontSize: 14,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 20,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
  },
  voiceStub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voiceIcon: {
    fontSize: 13,
  },
  voiceLabel: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.medium,
  },
  charCounter: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
  },
  contextTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  contextTagPrefix: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
  },
  contextTagChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.full,
    marginRight: 6,
  },
  contextTagChipText: {
    fontSize: 12,
  },
  companionCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  companionCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  companionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionAvatarIcon: {
    fontSize: 16,
  },
  companionDetails: {
    flex: 1,
  },
  companionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  companionTitle: {
    fontSize: 15,
    fontFamily: FontFamilies.serif.medium,
  },
  careBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  careBadgeText: {
    fontSize: 10,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 0.5,
  },
  companionBody: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 18,
    marginBottom: 8,
  },
  reflectionToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  toggleText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
    flex: 1,
  },
  commitSection: {
    gap: 8,
    marginTop: 4,
  },
  saveButton: {
    height: 52,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.sans.bold,
  },
  saveButtonArrow: {
    fontSize: 18,
  },
  commitFootnote: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FontFamilies.sans.regular,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.marginMobile,
  },
  modalCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalLotusIcon: {
    fontSize: 28,
  },
  modalTag: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    ...Typography.headlineMd,
    fontFamily: FontFamilies.serif.medium,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalBody: {
    ...Typography.bodyMd,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryButton: {
    height: 48,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryButtonIcon: {
    fontSize: 16,
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
  modalSecondaryButton: {
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.medium,
  },
});
