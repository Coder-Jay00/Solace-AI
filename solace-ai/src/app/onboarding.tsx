import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { onboardingStorage } from '@/services/onboardingStorage';
import { SolaceButton } from '@/components/solace';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  useEffect(() => {
    const onBackPress = () => {
      if (currentStep > 1) {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    await onboardingStorage.setOnboardingCompleted();
    router.replace('/login');
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: themeColors.background,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}>
      {/* ── Top Header Navigation ─────────────────────────────────── */}
      <View style={styles.header}>
        {currentStep > 1 ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous step"
            style={[
              styles.navCircleButton,
              {
                backgroundColor: themeColors.surfaceLow,
                borderColor: themeColors.border,
              },
            ]}>
            <Text style={[styles.navButtonIcon, { color: themeColors.primary }]}>
              ←
            </Text>
          </Pressable>
        ) : (
          <View style={styles.brandGroup}>
            <View
              style={[
                styles.brandIconBubble,
                { backgroundColor: themeColors.surfaceLow },
              ]}>
              <Text style={styles.brandIcon}>🌿</Text>
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: themeColors.primary }]}>
                Solace
              </Text>
              <Text
                style={[
                  styles.brandSub,
                  { color: themeColors.secondary },
                ]}>
                MINDFUL AI
              </Text>
            </View>
          </View>
        )}

        {/* Center Pill on Steps 2 and 3 */}
        {currentStep > 1 ? (
          <View
            style={[
              styles.centerBrandPill,
              {
                backgroundColor: themeColors.surfaceLow,
                borderColor: themeColors.border,
              },
            ]}>
            <Text style={styles.brandIconSmall}>🌿</Text>
            <Text
              style={[
                styles.centerBrandText,
                { color: themeColors.primary },
              ]}>
              Solace AI
            </Text>
          </View>
        ) : null}

        {/* Right Action: Skip or Step Count */}
        {currentStep < 3 ? (
          <Pressable
            onPress={handleFinish}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            style={styles.skipButton}>
            <Text
              style={[
                styles.skipText,
                { color: themeColors.textSecondary },
              ]}>
              Skip
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: themeColors.surfaceLow },
            ]}>
            <Text
              style={[
                styles.stepBadgeText,
                { color: themeColors.primary },
              ]}>
              3 of 3
            </Text>
          </View>
        )}
      </View>

      {/* ── Main Scrollable Content Area ─────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* STEP 1: Emotional Clarity */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            {/* Visual Canvas */}
            <View
              style={[
                styles.visualCanvas,
                {
                  backgroundColor: themeColors.surfaceLow,
                  borderColor: themeColors.border,
                },
              ]}>
              {/* Concentric Breathing Resonance Rings */}
              <View
                style={[
                  styles.outerRing,
                  { borderColor: themeColors.tertiary, opacity: 0.35 },
                ]}
              />
              <View
                style={[
                  styles.innerRing,
                  { borderColor: themeColors.secondary, opacity: 0.5 },
                ]}
              />
              <View
                style={[
                  styles.centerGlow,
                  { backgroundColor: themeColors.tertiary, opacity: 0.2 },
                ]}
              />

              {/* Meditative Silhouette Avatar */}
              <View style={styles.meditationFigure}>
                <View
                  style={[
                    styles.meditationHead,
                    { backgroundColor: themeColors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.meditationTorso,
                    { backgroundColor: themeColors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.meditationBase,
                    { backgroundColor: themeColors.primaryDark },
                  ]}
                />
              </View>

              {/* Floating Reflection Chip 1: Top Left */}
              <View
                style={[
                  styles.floatingChip1,
                  styles.floatingBadge,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <View
                  style={[
                    styles.badgeDot,
                    { backgroundColor: themeColors.secondary },
                  ]}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: themeColors.textSecondary },
                  ]}>
                  Calm • 10:30 AM
                </Text>
              </View>

              {/* Floating Reflection Chip 2: Bottom Right */}
              <View
                style={[
                  styles.floatingChip2,
                  styles.floatingBadge,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={[styles.heartIcon, { color: themeColors.primary }]}>♡</Text>
                <Text
                  style={[
                    styles.badgeTextBold,
                    { color: themeColors.primary },
                  ]}>
                  Peaceful
                </Text>
              </View>
            </View>

            {/* Narrative Content */}
            <View style={styles.narrativeBlock}>
              <View
                style={[
                  styles.eyebrowPill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text
                  style={[
                    styles.eyebrowText,
                    { color: themeColors.secondary },
                  ]}>
                  STEP 1 OF 3 • EMOTIONAL CLARITY
                </Text>
              </View>

              <Text style={[styles.headline, { color: themeColors.primary }]}>
                Make space for your feelings.
              </Text>

              <Text
                style={[
                  styles.bodyText,
                  { color: themeColors.textSecondary },
                ]}>
                Understand your emotions and discover patterns through gentle
                daily check-ins.
              </Text>
            </View>

            {/* Value Pills Row */}
            <View style={styles.valuePillsRow}>
              <View
                style={[
                  styles.valuePill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text style={styles.valuePillIcon}>😊</Text>
                <Text
                  style={[
                    styles.valuePillText,
                    { color: themeColors.text },
                  ]}>
                  Daily Mood Mapping
                </Text>
              </View>
              <View
                style={[
                  styles.valuePill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text style={styles.valuePillIcon}>🔒</Text>
                <Text
                  style={[
                    styles.valuePillText,
                    { color: themeColors.text },
                  ]}>
                  100% Private
                </Text>
              </View>
              <View
                style={[
                  styles.valuePill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text style={styles.valuePillIcon}>✨</Text>
                <Text
                  style={[
                    styles.valuePillText,
                    { color: themeColors.text },
                  ]}>
                  Empathetic AI
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Mindful Companion */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            {/* Visual Canvas: Glowing Companion & Mindful Orbit */}
            <View
              style={[
                styles.visualCanvas,
                {
                  backgroundColor: themeColors.surfaceLow,
                  borderColor: themeColors.border,
                },
              ]}>
              {/* Orbit Rings */}
              <View
                style={[
                  styles.orbitRingOuter,
                  { borderColor: themeColors.secondary, opacity: 0.3 },
                ]}
              />
              <View
                style={[
                  styles.orbitRingInner,
                  { borderColor: themeColors.tertiary, opacity: 0.4 },
                ]}
              />
              <View
                style={[
                  styles.orbitDot1,
                  { backgroundColor: themeColors.secondary },
                ]}
              />
              <View
                style={[
                  styles.orbitDot2,
                  { backgroundColor: themeColors.tertiary },
                ]}
              />

              {/* Central Companion Avatar Emblem */}
              <View
                style={[
                  styles.companionCenter,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.floating,
                  },
                ]}>
                <View
                  style={[
                    styles.companionInnerCircle,
                    { backgroundColor: themeColors.surfaceLow },
                  ]}>
                  <Text style={styles.companionCenterIcon}>🌿</Text>
                </View>
              </View>

              {/* Floating Bubble 1: Top Left */}
              <View
                style={[
                  styles.bubbleTopLeft,
                  styles.floatingBadge,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.bubbleIcon}>👂</Text>
                <Text
                  style={[
                    styles.badgeTextBold,
                    { color: themeColors.text },
                  ]}>
                  Always listening
                </Text>
              </View>

              {/* Floating Bubble 2: Bottom Right */}
              <View
                style={[
                  styles.bubbleBottomRight,
                  styles.floatingBadge,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.bubbleIcon}>🛡️</Text>
                <Text
                  style={[
                    styles.badgeTextBold,
                    { color: themeColors.text },
                  ]}>
                  Zero judgment • 100% private
                </Text>
              </View>

              {/* Mini Floating Sparkle */}
              <View
                style={[
                  styles.bubbleSparkle,
                  {
                    backgroundColor: themeColors.surfaceHighest,
                    borderColor: themeColors.border,
                  },
                ]}>
                <Text style={styles.sparkleIcon}>✨</Text>
              </View>
            </View>

            {/* Narrative Content */}
            <View style={styles.narrativeBlock}>
              <View
                style={[
                  styles.eyebrowPill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text
                  style={[
                    styles.eyebrowText,
                    { color: themeColors.secondary },
                  ]}>
                  STEP 2 OF 3 • MINDFUL COMPANION
                </Text>
              </View>

              <Text style={[styles.headline, { color: themeColors.primary }]}>
                You’re never alone in your thoughts.
              </Text>

              <Text
                style={[
                  styles.bodyText,
                  { color: themeColors.textSecondary },
                ]}>
                Meet Solace, your supportive AI companion who listens without
                judgment.
              </Text>
            </View>

            {/* Reassurance Tags */}
            <View style={styles.valuePillsRow}>
              <View
                style={[
                  styles.valuePill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text style={styles.valuePillIcon}>💬</Text>
                <Text
                  style={[
                    styles.valuePillText,
                    { color: themeColors.text },
                  ]}>
                  Grounded Dialogue
                </Text>
              </View>
              <View
                style={[
                  styles.valuePill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text style={styles.valuePillIcon}>🕊️</Text>
                <Text
                  style={[
                    styles.valuePillText,
                    { color: themeColors.text },
                  ]}>
                  Safe Space
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Daily Rhythm */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            {/* Visual Canvas: Rituals Composition */}
            <View
              style={[
                styles.visualCanvasStep3,
                {
                  backgroundColor: themeColors.surfaceLow,
                  borderColor: themeColors.border,
                },
              ]}>
              {/* Ritual Card 1: Box Breathing (Top Left) */}
              <View
                style={[
                  styles.ritualBox1,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <View style={styles.ritualHeader}>
                  <View
                    style={[
                      styles.ritualIconBadge,
                      { backgroundColor: themeColors.surfaceLow },
                    ]}>
                    <Text style={styles.ritualIcon}>💨</Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.ritualTitle,
                      { color: themeColors.primary },
                    ]}>
                    Box Breathing
                  </Text>
                </View>
                <Text
                  style={[
                    styles.ritualSub,
                    { color: themeColors.secondary },
                  ]}>
                  4s Inhale • 4s Exhale
                </Text>
              </View>

              {/* Ritual Card 2: Lotus Streak Badge (Top Right) */}
              <View
                style={[
                  styles.ritualBox2,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <View
                  style={[
                    styles.streakCircle,
                    { backgroundColor: themeColors.surfaceLow },
                  ]}>
                  <Text style={styles.streakIcon}>🌿</Text>
                </View>
                <Text
                  style={[
                    styles.streakNumber,
                    { color: themeColors.primary },
                  ]}>
                  7 Days
                </Text>
                <Text
                  style={[
                    styles.streakLabel,
                    { color: themeColors.secondary },
                  ]}>
                  MINDFUL STREAK
                </Text>
              </View>

              {/* Ritual Card 3: Night Gratitude (Bottom Left) */}
              <View
                style={[
                  styles.ritualBox3,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <View style={styles.ritualHeader}>
                  <View
                    style={[
                      styles.ritualIconBadge,
                      { backgroundColor: themeColors.surfaceLow },
                    ]}>
                    <Text style={styles.ritualIcon}>📖</Text>
                  </View>
                  <Text
                    style={[
                      styles.ritualTitle,
                      { color: themeColors.primary },
                    ]}>
                    Night Gratitude
                  </Text>
                </View>
                <Text
                  style={[
                    styles.ritualQuote,
                    { color: themeColors.textSecondary },
                  ]}>
                  “Quiet stillness tonight...”
                </Text>
              </View>

              {/* Ritual Card 4: Audio Calm (Bottom Right) */}
              <View
                style={[
                  styles.ritualBox4,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.audioIcon}>🎙️</Text>
                <Text
                  style={[
                    styles.audioText,
                    { color: themeColors.primary },
                  ]}>
                  Daily Audio Calm
                </Text>
              </View>
            </View>

            {/* Daily Habit Preview Card */}
            <View
              style={[
                styles.habitCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  ...Shadows.card,
                },
              ]}>
              <View style={styles.habitLeft}>
                <View
                  style={[
                    styles.habitIconCircle,
                    { backgroundColor: themeColors.surfaceLow },
                  ]}>
                  <Text style={styles.habitBellIcon}>🔔</Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.habitTitle,
                      { color: themeColors.primary },
                    ]}>
                    Gentle Evening Check-in
                  </Text>
                  <Text
                    style={[
                      styles.habitTime,
                      { color: themeColors.textSecondary },
                    ]}>
                    Recommended at 8:30 PM
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.readyBadge,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text
                  style={[
                    styles.readyBadgeText,
                    { color: themeColors.secondary },
                  ]}>
                  Ready
                </Text>
              </View>
            </View>

            {/* Narrative Content */}
            <View style={styles.narrativeBlock}>
              <View
                style={[
                  styles.eyebrowPill,
                  { backgroundColor: themeColors.surfaceLow },
                ]}>
                <Text
                  style={[
                    styles.eyebrowText,
                    { color: themeColors.secondary },
                  ]}>
                  STEP 3 OF 3 • DAILY RHYTHM
                </Text>
              </View>

              <Text style={[styles.headline, { color: themeColors.primary }]}>
                Small moments create meaningful change.
              </Text>

              <Text
                style={[
                  styles.bodyText,
                  { color: themeColors.textSecondary },
                ]}>
                Build healthier habits through breathing, journaling and
                personalized wellness activities.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Controls & Pagination ─────────────────────────── */}
      <View style={styles.footerControls}>
        {/* 3-Dot Pagination Indicator */}
        <View style={styles.paginationRow}>
          <View
            style={[
              currentStep === 1 ? styles.activePill : styles.inactiveDot,
              {
                backgroundColor:
                  currentStep === 1
                    ? themeColors.primary
                    : themeColors.surfaceHighest,
              },
            ]}
          />
          <View
            style={[
              currentStep === 2 ? styles.activePill : styles.inactiveDot,
              {
                backgroundColor:
                  currentStep === 2
                    ? themeColors.primary
                    : themeColors.surfaceHighest,
              },
            ]}
          />
          <View
            style={[
              currentStep === 3 ? styles.activePill : styles.inactiveDot,
              {
                backgroundColor:
                  currentStep === 3
                    ? themeColors.primary
                    : themeColors.surfaceHighest,
              },
            ]}
          />
        </View>

        {/* Primary Action Button */}
        <SolaceButton
          title={currentStep === 3 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          loading={isFinishing}
          style={styles.actionButton}
        />

        {/* Trust Footnote on Step 3 */}
        {currentStep === 3 ? (
          <Text
            style={[
              styles.trustFootnote,
              { color: themeColors.textSecondary },
            ]}>
            Free 14-day trial • Cancel anytime • 🔒 100% Private
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.marginMobile,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandIcon: {
    fontSize: 16,
  },
  brandIconSmall: {
    fontSize: 14,
    marginRight: 6,
  },
  brandTitle: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 16,
    lineHeight: 18,
  },
  brandSub: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  centerBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  centerBrandText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  stepBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
  },
  stepBadgeText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  visualCanvas: {
    width: '100%',
    height: 250,
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: Spacing.sm,
  },
  visualCanvasStep3: {
    width: '100%',
    height: 240,
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  outerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  innerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
  },
  centerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  meditationFigure: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  meditationHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  meditationTorso: {
    width: 32,
    height: 40,
    borderRadius: 8,
  },
  meditationBase: {
    width: 72,
    height: 14,
    borderRadius: 7,
    marginTop: -2,
  },
  floatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
    position: 'absolute',
    zIndex: 10,
  },
  floatingChip1: {
    top: 14,
    left: 12,
  },
  floatingChip2: {
    bottom: 16,
    right: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
  },
  badgeTextBold: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
  },
  heartIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  narrativeBlock: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  eyebrowPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    marginBottom: Spacing.xs,
  },
  eyebrowText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  headline: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  bodyText: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  valuePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
  },
  valuePillIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  valuePillText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
  },
  orbitRingOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  orbitRingInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
  },
  orbitDot1: {
    position: 'absolute',
    top: 28,
    left: '50%',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: -3.5,
  },
  orbitDot2: {
    position: 'absolute',
    bottom: 35,
    right: 40,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  companionCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  companionInnerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionCenterIcon: {
    fontSize: 36,
  },
  bubbleTopLeft: {
    top: 14,
    left: 10,
    transform: [{ rotate: '-3deg' }],
  },
  bubbleBottomRight: {
    bottom: 14,
    right: 10,
    transform: [{ rotate: '2deg' }],
  },
  bubbleIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  bubbleSparkle: {
    position: 'absolute',
    top: 20,
    right: 25,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sparkleIcon: {
    fontSize: 13,
  },
  ritualBox1: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: width * 0.4,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  ritualBox2: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: width * 0.38,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  ritualBox3: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: width * 0.44,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  ritualBox4: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ritualIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  ritualIcon: {
    fontSize: 11,
  },
  ritualTitle: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
    flex: 1,
  },
  ritualSub: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 9,
  },
  ritualQuote: {
    fontFamily: FontFamilies.serif.italic,
    fontSize: 10,
    lineHeight: 13,
  },
  streakCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakNumber: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 15,
    lineHeight: 18,
  },
  streakLabel: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  audioIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  audioText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
  },
  habitCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Radii.card,
    borderWidth: 1,
    marginVertical: Spacing.xs,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  habitBellIcon: {
    fontSize: 16,
  },
  habitTitle: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 13,
  },
  habitTime: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 11,
    marginTop: 1,
  },
  readyBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.full,
  },
  readyBadgeText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
  },
  footerControls: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  activePill: {
    width: 26,
    height: 7,
    borderRadius: 3.5,
  },
  inactiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  actionButton: {
    width: '100%',
  },
  trustFootnote: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
