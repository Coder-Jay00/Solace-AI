/**
 * Solace AI - Guided Breathing Exercise & Custom Studio
 * Phase 7: Guided Breathing Exercise
 *
 * Faithfully matches Google Stitch design:
 * solace-design-reference/find_your_calm/
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  AppState,
  AppStateStatus,
  Modal,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/solace';
import {
  BreathingPattern,
  BreathingPresetId,
  BREATHING_PRESETS,
  ActivePhaseInfo,
  BreathingSessionStats,
} from '@/types/breathing';
import { breathingEngine } from '@/services/breathingEngine';
import { breathingService } from '@/services/breathingService';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { user } = useAuth();

  // Session Configuration State
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PRESETS[0]);
  const [sessionMinutes, setSessionMinutes] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [showStudioModal, setShowStudioModal] = useState<boolean>(false);

  // Custom Pattern Editing State
  const [customInhale, setCustomInhale] = useState<number>(4);
  const [customHoldIn, setCustomHoldIn] = useState<number>(2);
  const [customExhale, setCustomExhale] = useState<number>(6);
  const [customHoldOut, setCustomHoldOut] = useState<number>(2);
  const [customError, setCustomError] = useState<string | null>(null);

  // Active Session Running State
  const [sessionState, setSessionState] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [secondsRemainingInPhase, setSecondsRemainingInPhase] = useState<number>(4);
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState<number>(180);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [completionStats, setCompletionStats] = useState<BreathingSessionStats | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const haloAnim = useRef(new Animated.Value(0.95)).current;
  const haloMidAnim = useRef(new Animated.Value(0.98)).current;

  // Refs for timer cleanup & backgrounding
  const timerRef = useRef<any>(null);
  const backgroundTimestampRef = useRef<number | null>(null);
  const totalElapsedSecondsRef = useRef<number>(0);

  // Current active phases for the selected pattern
  const activePhases = useMemo(() => {
    return breathingEngine.getPhasesForPattern(selectedPattern);
  }, [selectedPattern]);

  const currentPhase: ActivePhaseInfo = activePhases[currentPhaseIndex] || activePhases[0] || {
    type: 'inhale',
    label: 'Inhale slowly',
    shortLabel: 'Inhale',
    durationSeconds: 4,
    scaleTarget: 1.15,
  };

  const cycleDuration = useMemo(() => {
    return breathingEngine.getCycleDuration(selectedPattern);
  }, [selectedPattern]);

  // Clean unmount of timers & animation stops
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      scaleAnim.stopAnimation();
      haloAnim.stopAnimation();
      haloMidAnim.stopAnimation();
    };
  }, []);

  // Handle AppState (backgrounding/foregrounding) to avoid timer drift
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextAppState === 'active' && backgroundTimestampRef.current && sessionState === 'running') {
        const elapsedSinceBg = Math.floor((Date.now() - backgroundTimestampRef.current) / 1000);
        backgroundTimestampRef.current = null;

        if (elapsedSinceBg > 0) {
          // Advance the session realistically
          setTotalSecondsRemaining((prev) => {
            const nextTotal = Math.max(0, prev - elapsedSinceBg);
            if (nextTotal <= 0) {
              handleSessionComplete();
            }
            return nextTotal;
          });

          // Advance cycles calculation
          totalElapsedSecondsRef.current += elapsedSinceBg;
          const totalCycles = Math.floor(totalElapsedSecondsRef.current / cycleDuration);
          setCompletedCycles(totalCycles);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [sessionState, cycleDuration]);

  // Synchronize Animations when phase changes
  const animatePhase = useCallback((phase: ActivePhaseInfo) => {
    const isExpanding = phase.type === 'inhale';
    const isContracting = phase.type === 'exhale';
    const durationMs = phase.durationSeconds * 1000;

    if (isExpanding) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.14,
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 1.24,
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloMidAnim, {
          toValue: 1.18,
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isContracting) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.90,
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0.96,
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloMidAnim, {
          toValue: 0.98,
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [scaleAnim, haloAnim, haloMidAnim]);

  // Session Timer Tick Loop
  const startTimerLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTotalSecondsRemaining((prevTotal) => {
        if (prevTotal <= 1) {
          handleSessionComplete();
          return 0;
        }
        return prevTotal - 1;
      });

      totalElapsedSecondsRef.current += 1;

      setSecondsRemainingInPhase((prevPhaseSecs) => {
        if (prevPhaseSecs <= 1) {
          // Transition to next phase
          setCurrentPhaseIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % activePhases.length;
            if (nextIndex === 0) {
              setCompletedCycles((c) => c + 1);
            }
            animatePhase(activePhases[nextIndex]);
            return nextIndex;
          });
          return activePhases[(currentPhaseIndex + 1) % activePhases.length]?.durationSeconds || 4;
        }
        return prevPhaseSecs - 1;
      });
    }, 1000);
  }, [activePhases, currentPhaseIndex, animatePhase]);

  const handleStartSession = () => {
    if (sessionState === 'running') return;

    const initialPhase = activePhases[0] || {
      type: 'inhale',
      label: 'Inhale slowly',
      shortLabel: 'Inhale',
      durationSeconds: 4,
      scaleTarget: 1.15,
    };

    setCurrentPhaseIndex(0);
    setSecondsRemainingInPhase(initialPhase.durationSeconds);
    setTotalSecondsRemaining(sessionMinutes * 60);
    totalElapsedSecondsRef.current = 0;
    setCompletedCycles(0);
    setSessionState('running');

    animatePhase(initialPhase);
    startTimerLoop();
  };

  const handlePauseSession = () => {
    if (sessionState !== 'running') return;
    if (timerRef.current) clearInterval(timerRef.current);
    scaleAnim.stopAnimation();
    haloAnim.stopAnimation();
    haloMidAnim.stopAnimation();
    setSessionState('paused');
  };

  const handleResumeSession = () => {
    if (sessionState !== 'paused') return;
    setSessionState('running');
    animatePhase(currentPhase);
    startTimerLoop();
  };

  const handleResetSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    scaleAnim.stopAnimation();
    haloAnim.stopAnimation();
    haloMidAnim.stopAnimation();

    scaleAnim.setValue(0.92);
    haloAnim.setValue(0.95);
    haloMidAnim.setValue(0.98);

    setSessionState('idle');
    setCurrentPhaseIndex(0);
    setSecondsRemainingInPhase(activePhases[0]?.durationSeconds || 4);
    setTotalSecondsRemaining(sessionMinutes * 60);
    setCompletedCycles(0);
    totalElapsedSecondsRef.current = 0;
  };

  // Handle hardware back on Android cleanly
  useEffect(() => {
    const onBackPress = () => {
      if (sessionState === 'running' || sessionState === 'paused') {
        handleResetSession();
      }
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [sessionState]);

  const handleSessionComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    scaleAnim.stopAnimation();
    haloAnim.stopAnimation();
    haloMidAnim.stopAnimation();

    const elapsed = totalElapsedSecondsRef.current || sessionMinutes * 60;
    const cycles = completedCycles || Math.max(1, Math.floor((sessionMinutes * 60) / cycleDuration));
    const nowIso = new Date().toISOString();

    setSessionState('completed');
    setCompletionStats({
      patternName: selectedPattern.name,
      totalDurationSeconds: elapsed,
      completedCycles: cycles,
      completedAt: nowIso,
    });

    // Persist completed session to scoped storage
    const userId = user?.id || 'guest_user';
    breathingService.saveBreathingSession(userId, {
      patternId: selectedPattern.id,
      patternName: selectedPattern.name,
      targetDurationMinutes: sessionMinutes,
      completedDurationSeconds: elapsed,
      completedCycles: cycles,
      isCompleted: true,
    }).catch((err) => console.warn('[BreathingScreen] Failed to save breathing session:', err));
  };

  const handleApplyCustomPattern = () => {
    const validation = breathingEngine.validatePattern({
      inhale: customInhale,
      holdIn: customHoldIn,
      exhale: customExhale,
      holdOut: customHoldOut,
    });

    if (!validation.valid) {
      setCustomError(validation.errors[0]);
      return;
    }

    const updatedCustom: BreathingPattern = {
      id: 'custom',
      name: 'Custom Studio',
      tagline: `${customInhale}-${customHoldIn}-${customExhale}-${customHoldOut} Rhythm`,
      description: 'Personalized cadence configured for your daily mindfulness retreat.',
      inhale: customInhale,
      holdIn: customHoldIn,
      exhale: customExhale,
      holdOut: customHoldOut,
    };

    setSelectedPattern(updatedCustom);
    setCustomError(null);
    setShowStudioModal(false);
    handleResetSession();
  };

  return (
    <ScreenContainer>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            paddingTop: Math.max(insets.top, 16),
          },
        ]}>
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave Session"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: themeColors.secondary },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.backButtonArrow, { color: themeColors.text }]}>←</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Text style={styles.headerLotusIcon}>🌿</Text>
              <Text style={[styles.headerTitle, { color: themeColors.primary }]}>
                Find Your Calm
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: themeColors.primary }]}>
              SOLACE AI
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Breathing Studio Settings"
            onPress={() => setShowStudioModal(true)}
            style={({ pressed }) => [
              styles.studioBtn,
              { backgroundColor: themeColors.secondary },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.studioBtnText, { color: themeColors.primary }]}>⚙️</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Subtle Introduction & Cadence Pill */}
          <View style={styles.introBlock}>
            <Pressable
              onPress={() => setShowStudioModal(true)}
              style={[
                styles.cadencePill,
                { backgroundColor: themeColors.secondary },
                Shadows.card,
              ]}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={[styles.cadencePillText, { color: themeColors.primary }]}>
                {selectedPattern.name} • {selectedPattern.tagline}
              </Text>
            </Pressable>

            <Text style={[styles.headlineText, { color: themeColors.text }]}>
              {sessionState === 'running'
                ? "Breathe in peace, release tension."
                : "Let's take a gentle pause."}
            </Text>
            <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>
              {selectedPattern.description}
            </Text>
          </View>

          {/* Central Breathing Visual Sanctuary */}
          <View style={styles.visualContainer}>
            {/* Ambient Halos */}
            <Animated.View
              style={[
                styles.haloOuter,
                {
                  backgroundColor: themeColors.secondary,
                  transform: [{ scale: haloAnim }],
                  opacity: 0.4,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.haloMid,
                {
                  backgroundColor: themeColors.blush,
                  transform: [{ scale: haloMidAnim }],
                  opacity: 0.65,
                },
              ]}
            />

            {/* Organic Core Orb */}
            <Animated.View
              style={[
                styles.coreOrb,
                {
                  backgroundColor: themeColors.surfaceElevated,
                  borderColor: themeColors.primary,
                  transform: [{ scale: scaleAnim }],
                },
                Shadows.glow,
              ]}>
              <View
                style={[
                  styles.orbIconCircle,
                  { backgroundColor: themeColors.blush },
                ]}>
                <Text style={styles.orbLotusIcon}>🌿</Text>
              </View>

              <Text style={[styles.phaseLabelText, { color: themeColors.primary }]}>
                {sessionState === 'idle' ? 'Ready to Begin' : currentPhase.label}
              </Text>

              <View style={styles.countdownRow}>
                <Text style={[styles.countdownValue, { color: themeColors.primary }]}>
                  {sessionState === 'idle' ? selectedPattern.inhale : secondsRemainingInPhase}
                </Text>
                <Text style={[styles.secUnit, { color: themeColors.textSecondary }]}>SEC</Text>
              </View>

              {/* Rhythm indicator dots */}
              <View style={styles.rhythmDotsRow}>
                {activePhases.map((p, idx) => {
                  const isActive = idx === currentPhaseIndex && sessionState === 'running';
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.rhythmDot,
                        {
                          backgroundColor: isActive
                            ? themeColors.primary
                            : themeColors.secondary,
                          transform: [{ scale: isActive ? 1.4 : 1 }],
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </Animated.View>
          </View>

          {/* Dynamic Active Step Indicators */}
          <View style={styles.phaseStepRow}>
            {activePhases.map((phase, idx) => {
              const isActive = idx === currentPhaseIndex && sessionState === 'running';
              return (
                <View
                  key={idx}
                  style={[
                    styles.phasePill,
                    {
                      backgroundColor: isActive
                        ? themeColors.primary
                        : themeColors.secondary,
                    },
                    isActive && Shadows.card,
                  ]}>
                  <Text
                    style={[
                      styles.phasePillLabel,
                      {
                        color: isActive ? themeColors.onPrimary : themeColors.text,
                        fontFamily: isActive ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                      },
                    ]}>
                    {phase.shortLabel}
                  </Text>
                  <Text
                    style={[
                      styles.phasePillSec,
                      { color: isActive ? themeColors.onPrimary : themeColors.textSecondary },
                    ]}>
                    {phase.durationSeconds}s
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Session Settings & Remaining Time Card */}
          <View
            style={[
              styles.sessionGoalCard,
              {
                backgroundColor: themeColors.surfaceElevated,
                borderColor: themeColors.border,
              },
              Shadows.card,
            ]}>
            <View style={styles.sessionGoalHeader}>
              <View>
                <Text style={[styles.sessionGoalTitle, { color: themeColors.primary }]}>
                  Session Goal
                </Text>
                <Text style={[styles.cyclesSubtext, { color: themeColors.textSecondary }]}>
                  {completedCycles} {completedCycles === 1 ? 'cycle' : 'cycles'} completed
                </Text>
              </View>

              <View style={[styles.timeRemainingBadge, { backgroundColor: themeColors.secondary }]}>
                <Text style={styles.clockIcon}>⏱️</Text>
                <Text style={[styles.timeRemainingText, { color: themeColors.primary }]}>
                  {breathingEngine.formatTime(totalSecondsRemaining)} remaining
                </Text>
              </View>
            </View>

            {/* Quick Duration Pills */}
            {sessionState === 'idle' && (
              <View
                style={[
                  styles.durationPillsContainer,
                  { backgroundColor: themeColors.secondary },
                ]}>
                {[1, 2, 3, 5, 10].map((mins) => (
                  <Pressable
                    key={mins}
                    onPress={() => {
                      setSessionMinutes(mins);
                      setTotalSecondsRemaining(mins * 60);
                    }}
                    style={[
                      styles.durationPillBtn,
                      sessionMinutes === mins && [
                        styles.durationPillBtnActive,
                        { backgroundColor: themeColors.primary },
                      ],
                    ]}>
                    <Text
                      style={[
                        styles.durationPillText,
                        {
                          color: sessionMinutes === mins ? themeColors.onPrimary : themeColors.textSecondary,
                          fontFamily: sessionMinutes === mins ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                        },
                      ]}>
                      {mins}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Primary Controls */}
          <View style={styles.controlsSection}>
            {sessionState === 'idle' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Begin Guided Breathing Session"
                onPress={handleStartSession}
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  { backgroundColor: themeColors.primary },
                  Shadows.floating,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.actionButtonIcon, { color: themeColors.onPrimary }]}>▶</Text>
                <Text style={[styles.actionButtonText, { color: themeColors.onPrimary }]}>Begin Guided Session</Text>
              </Pressable>
            ) : sessionState === 'running' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pause Breathing Session"
                onPress={handlePauseSession}
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  { backgroundColor: themeColors.primary },
                  Shadows.floating,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.actionButtonIcon, { color: themeColors.onPrimary }]}>⏸</Text>
                <Text style={[styles.actionButtonText, { color: themeColors.onPrimary }]}>Pause Session</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resume Breathing Session"
                onPress={handleResumeSession}
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  { backgroundColor: themeColors.primary },
                  Shadows.floating,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.actionButtonIcon, { color: themeColors.onPrimary }]}>▶</Text>
                <Text style={[styles.actionButtonText, { color: themeColors.onPrimary }]}>Resume Breathing</Text>
              </Pressable>
            )}

            {sessionState !== 'idle' && (
              <View style={styles.secondaryControlsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="End Session"
                  onPress={handleSessionComplete}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { backgroundColor: themeColors.secondary },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.secondaryBtnText, { color: themeColors.primary }]}>
                    End & Reflect
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reset Session"
                  onPress={handleResetSession}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { backgroundColor: themeColors.secondary },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.secondaryBtnText, { color: themeColors.textSecondary }]}>
                    Reset
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Gentle Safety & Affirmation Footnote */}
          <View style={styles.safetyFootnote}>
            <Text style={[styles.safetyNoticeText, { color: themeColors.textMuted }]}>
              Breathe gently and naturally. If you ever feel dizzy, stop and return to normal breathing.
            </Text>
            <Text style={[styles.affirmationQuote, { color: themeColors.primary }]}>
              “Every breath is a fresh beginning.”
            </Text>
          </View>
        </ScrollView>

        {/* Custom Breathing Studio Modal */}
        <Modal
          visible={showStudioModal}
          transparent
          animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
            <View
              style={[
                styles.studioCard,
                { backgroundColor: themeColors.surfaceElevated },
                Shadows.floating,
              ]}>
              <View style={styles.studioModalHeader}>
                <Text style={[styles.studioModalTitle, { color: themeColors.primary }]}>
                  Breathing Studio
                </Text>
                <Pressable
                  onPress={() => setShowStudioModal(false)}
                  style={styles.closeStudioBtn}>
                  <Text style={[styles.closeStudioText, { color: themeColors.textSecondary }]}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.studioScroll}>
                <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
                  CHOOSE A PATTERN
                </Text>

                <View style={styles.presetsList}>
                  {BREATHING_PRESETS.map((preset) => {
                    const isSelected = selectedPattern.id === preset.id;
                    return (
                      <Pressable
                        key={preset.id}
                        onPress={() => {
                          setSelectedPattern(preset);
                          handleResetSession();
                        }}
                        style={[
                          styles.presetItem,
                          {
                            backgroundColor: isSelected
                              ? themeColors.blush
                              : themeColors.secondary,
                            borderColor: isSelected
                              ? themeColors.primary
                              : themeColors.border,
                          },
                        ]}>
                        <View style={styles.presetItemHeader}>
                          <Text style={[styles.presetName, { color: themeColors.primary }]}>
                            {preset.name}
                          </Text>
                          <Text style={[styles.presetDurationBadge, { color: themeColors.primary }]}>
                            {breathingEngine.getCycleDuration(preset)}s cycle
                          </Text>
                        </View>
                        <Text style={[styles.presetTagline, { color: themeColors.textSecondary }]}>
                          {preset.tagline}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom Timers Configuration (when custom is selected) */}
                {selectedPattern.id === 'custom' && (
                  <View style={[styles.customEditorCard, { backgroundColor: themeColors.secondary }]}>
                    <Text style={[styles.customEditorTitle, { color: themeColors.primary }]}>
                      Custom Cycle Timers
                    </Text>

                    {customError && (
                      <Text style={[styles.errorText, { color: themeColors.error }]}>
                        {customError}
                      </Text>
                    )}

                    <View style={styles.stepperRow}>
                      <Text style={[styles.stepperLabel, { color: themeColors.text }]}>Inhale (s):</Text>
                      <View style={styles.stepperControls}>
                        <Pressable
                          onPress={() => setCustomInhale((v) => Math.max(1, v - 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>-</Text>
                        </Pressable>
                        <Text style={[styles.stepperValue, { color: themeColors.primary }]}>{customInhale}</Text>
                        <Pressable
                          onPress={() => setCustomInhale((v) => Math.min(15, v + 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.stepperRow}>
                      <Text style={[styles.stepperLabel, { color: themeColors.text }]}>Hold after inhale (s):</Text>
                      <View style={styles.stepperControls}>
                        <Pressable
                          onPress={() => setCustomHoldIn((v) => Math.max(0, v - 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>-</Text>
                        </Pressable>
                        <Text style={[styles.stepperValue, { color: themeColors.primary }]}>{customHoldIn}</Text>
                        <Pressable
                          onPress={() => setCustomHoldIn((v) => Math.min(15, v + 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.stepperRow}>
                      <Text style={[styles.stepperLabel, { color: themeColors.text }]}>Exhale (s):</Text>
                      <View style={styles.stepperControls}>
                        <Pressable
                          onPress={() => setCustomExhale((v) => Math.max(1, v - 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>-</Text>
                        </Pressable>
                        <Text style={[styles.stepperValue, { color: themeColors.primary }]}>{customExhale}</Text>
                        <Pressable
                          onPress={() => setCustomExhale((v) => Math.min(20, v + 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.stepperRow}>
                      <Text style={[styles.stepperLabel, { color: themeColors.text }]}>Hold after exhale (s):</Text>
                      <View style={styles.stepperControls}>
                        <Pressable
                          onPress={() => setCustomHoldOut((v) => Math.max(0, v - 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>-</Text>
                        </Pressable>
                        <Text style={[styles.stepperValue, { color: themeColors.primary }]}>{customHoldOut}</Text>
                        <Pressable
                          onPress={() => setCustomHoldOut((v) => Math.min(15, v + 1))}
                          style={[styles.stepperBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                          <Text style={[styles.stepperBtnText, { color: themeColors.primary }]}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <Pressable
                      onPress={handleApplyCustomPattern}
                      style={[styles.applyCustomBtn, { backgroundColor: themeColors.primary }]}>
                      <Text style={[styles.applyCustomBtnText, { color: themeColors.onPrimary }]}>Apply Custom Timers</Text>
                    </Pressable>
                  </View>
                )}

                {/* Optional Cues Toggles */}
                <View style={styles.togglesSection}>
                  <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
                    SENSORY PREFERENCES
                  </Text>

                  <Pressable
                    onPress={() => setSoundEnabled((v) => !v)}
                    style={styles.toggleRow}>
                    <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
                      Gentle bell chime
                    </Text>
                    <View
                      style={[
                        styles.toggleSwitch,
                        {
                          backgroundColor: soundEnabled
                            ? themeColors.primary
                            : themeColors.border,
                        },
                      ]}>
                      <Text style={[styles.switchKnobText, { color: themeColors.onPrimary }]}>{soundEnabled ? '✓' : ''}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setHapticEnabled((v) => !v)}
                    style={styles.toggleRow}>
                    <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
                      Mindful haptic feedback
                    </Text>
                    <View
                      style={[
                        styles.toggleSwitch,
                        {
                          backgroundColor: hapticEnabled
                            ? themeColors.primary
                            : themeColors.border,
                        },
                      ]}>
                      <Text style={[styles.switchKnobText, { color: themeColors.onPrimary }]}>{hapticEnabled ? '✓' : ''}</Text>
                    </View>
                  </Pressable>
                </View>
              </ScrollView>

              <Pressable
                onPress={() => setShowStudioModal(false)}
                style={[styles.saveStudioBtn, { backgroundColor: themeColors.primary }]}>
                <Text style={[styles.saveStudioBtnText, { color: themeColors.onPrimary }]}>Save & Return to Session</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Completion Modal */}
        <Modal
          visible={sessionState === 'completed'}
          transparent
          animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
            <View
              style={[
                styles.completionCard,
                { backgroundColor: themeColors.surfaceElevated },
                Shadows.floating,
              ]}>
              <View
                style={[
                  styles.completionLotusCircle,
                  { backgroundColor: themeColors.blush },
                ]}>
                <Text style={styles.completionLotusIcon}>🌿</Text>
              </View>

              <Text style={[styles.completionTag, { color: themeColors.primary }]}>
                PRESENCE ACKNOWLEDGED
              </Text>
              <Text style={[styles.completionTitle, { color: themeColors.primary }]}>
                Peaceful presence achieved.
              </Text>
              <Text style={[styles.completionSubtext, { color: themeColors.textSecondary }]}>
                You gave yourself the gift of presence. Your nervous system is resting and restored.
              </Text>

              {/* Stats Card */}
              <View style={[styles.statsCard, { backgroundColor: themeColors.secondary }]}>
                <View style={styles.statCol}>
                  <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                    {completionStats ? Math.round(completionStats.totalDurationSeconds / 60) : sessionMinutes} min
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
                    Time Breathed
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />

                <View style={styles.statCol}>
                  <Text style={[styles.statNumber, { color: themeColors.primary }]}>
                    {completionStats ? completionStats.completedCycles : completedCycles}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
                    Cycles Completed
                  </Text>
                </View>
              </View>

              <View style={styles.completionActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    handleResetSession();
                    handleStartSession();
                  }}
                  style={[styles.completionPrimaryBtn, { backgroundColor: themeColors.primary }]}>
                  <Text style={[styles.completionPrimaryBtnText, { color: themeColors.onPrimary }]}>Repeat Session</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    handleResetSession();
                    router.push('/mood-check-in');
                  }}
                  style={[styles.completionSecondaryBtn, { backgroundColor: themeColors.secondary }]}>
                  <Text style={[styles.completionSecondaryBtnText, { color: themeColors.primary }]}>
                    Log in Daily Mood →
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    handleResetSession();
                    router.replace('/(tabs)/home');
                  }}
                  style={styles.completionHomeLink}>
                  <Text style={[styles.completionHomeText, { color: themeColors.textSecondary }]}>
                    Return Home
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerCenter: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLotusIcon: {
    fontSize: 16,
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.5,
  },
  studioBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioBtnText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl + 40,
  },
  introBlock: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cadencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radii.full,
    marginBottom: 8,
  },
  sparkleIcon: {
    fontSize: 12,
  },
  cadencePillText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 0.5,
  },
  headlineText: {
    ...Typography.headlineLgMobile,
    fontFamily: FontFamilies.serif.medium,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  visualContainer: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    position: 'relative',
  },
  haloOuter: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
  },
  haloMid: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
  },
  coreOrb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  orbIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  orbLotusIcon: {
    fontSize: 16,
  },
  phaseLabelText: {
    fontSize: 18,
    fontFamily: FontFamilies.serif.medium,
    marginBottom: 2,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  countdownValue: {
    fontSize: 32,
    fontFamily: FontFamilies.serif.medium,
  },
  secUnit: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
  },
  rhythmDotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  rhythmDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phaseStepRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  phasePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  phasePillLabel: {
    fontSize: 12,
  },
  phasePillSec: {
    fontSize: 10,
    marginTop: 1,
  },
  sessionGoalCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sessionGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionGoalTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
  cyclesSubtext: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.regular,
  },
  timeRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  clockIcon: {
    fontSize: 12,
  },
  timeRemainingText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.bold,
  },
  durationPillsContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radii.full,
    marginTop: 4,
  },
  durationPillBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  durationPillBtnActive: {
    // shadow handled inline
  },
  durationPillText: {
    fontSize: 12,
  },
  controlsSection: {
    gap: 10,
    marginVertical: Spacing.sm,
  },
  primaryActionButton: {
    height: 52,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.sans.bold,
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.semiBold,
  },
  safetyFootnote: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.md,
    gap: 8,
  },
  safetyNoticeText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  affirmationQuote: {
    fontSize: 15,
    fontFamily: FontFamilies.serif.italic,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.marginMobile,
  },
  studioCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  studioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  studioModalTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  closeStudioBtn: {
    padding: 6,
  },
  closeStudioText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studioScroll: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  presetsList: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  presetItem: {
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1.5,
  },
  presetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
  presetDurationBadge: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
  },
  presetTagline: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.regular,
    marginTop: 2,
  },
  customEditorCard: {
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  customEditorTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  stepperLabel: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.medium,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepperValue: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
    minWidth: 20,
    textAlign: 'center',
  },
  applyCustomBtn: {
    height: 40,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  applyCustomBtnText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.bold,
  },
  togglesSection: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleLabel: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.regular,
  },
  toggleSwitch: {
    width: 32,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchKnobText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  saveStudioBtn: {
    height: 48,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveStudioBtnText: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
  completionCard: {
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  completionLotusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completionLotusIcon: {
    fontSize: 32,
  },
  completionTag: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  completionTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
    textAlign: 'center',
    marginBottom: 6,
  },
  completionSubtext: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: FontFamilies.sans.bold,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  completionActions: {
    width: '100%',
    gap: 10,
  },
  completionPrimaryBtn: {
    height: 48,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPrimaryBtnText: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
  completionSecondaryBtn: {
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionSecondaryBtnText: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.semiBold,
  },
  completionHomeLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  completionHomeText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.medium,
  },
});
