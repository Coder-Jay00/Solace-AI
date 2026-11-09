import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { onboardingStorage } from '@/services/onboardingStorage';
import { authService } from '@/services/authService';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Floating emblem loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Pulsing indicator dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Progress bar cycle
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // 5. Check onboarding and authentication to navigate after graceful display
    const checkNavigation = async () => {
      const startTime = Date.now();
      const hasCompleted = await onboardingStorage.hasCompletedOnboarding();
      const sessionUser = await authService.getPersistedSession();
      const elapsed = Date.now() - startTime;
      const minDisplayDuration = 1800; // Calming 1.8s duration
      const remainingTime = Math.max(0, minDisplayDuration - elapsed);

      setTimeout(() => {
        if (!isMounted) return;

        if (!hasCompleted) {
          // Fresh installation: Splash → Onboarding
          router.replace('/onboarding');
        } else if (sessionUser) {
          // Returning user with valid demonstration session: Splash → Home
          router.replace('/(tabs)/home');
        } else {
          // Returning user without a valid session: Splash → Login
          router.replace('/login');
        }
      }, remainingTime);
    };

    checkNavigation();

    return () => {
      isMounted = false;
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '85%'],
  });

  const progressMarginLeft = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '15%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.background,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}>
      {/* Ambient background blur circles */}
      <View
        style={[
          styles.ambientTopGlow,
          { backgroundColor: themeColors.surfaceHighest, opacity: 0.5 },
        ]}
      />
      <View
        style={[
          styles.ambientBottomGlow,
          { backgroundColor: themeColors.surfaceSubtle, opacity: 0.6 },
        ]}
      />

      {/* Top Header Spacing */}
      <View style={styles.topBar}>
        <View style={styles.topDot} />
      </View>

      {/* Center Botanical Content */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
          },
        ]}>
        {/* Glowing Halo & Botanical Emblem */}
        <View style={styles.emblemContainer}>
          <View
            style={[
              styles.emblemHalo,
              { backgroundColor: themeColors.blush, opacity: 0.5 },
            ]}
          />
          <View
            style={[
              styles.emblemCircle,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                ...Shadows.floating,
              },
            ]}>
            {/* Multi-layered Botanical Emblem */}
            <View style={styles.lotusContainer}>
              <Text style={[styles.lotusIcon, { color: themeColors.primary }]}>
                🌿
              </Text>
            </View>
          </View>
        </View>

        {/* Mindful Companion Pill */}
        <View
          style={[
            styles.brandBadge,
            {
              backgroundColor: themeColors.surfaceLow,
              borderColor: themeColors.border,
            },
          ]}>
          <Animated.View
            style={[
              styles.pulseDot,
              {
                backgroundColor: themeColors.primary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={[styles.brandBadgeText, { color: themeColors.primary }]}>
            MINDFUL COMPANION
          </Text>
        </View>

        {/* Brand Headline */}
        <Text style={[styles.title, { color: themeColors.text }]}>
          Solace AI
        </Text>

        {/* Tagline */}
        <Text style={[styles.tagline, { color: themeColors.primary }]}>
          “Find your calm.”
        </Text>

        {/* Supporting statement */}
        <Text style={[styles.statement, { color: themeColors.textSecondary }]}>
          Your space to feel, heal and grow.
        </Text>

        {/* Micro wellness pillars */}
        <View style={styles.pillarsRow}>
          <View style={styles.pillarItem}>
            <Text style={[styles.pillarCheck, { color: themeColors.primary }]}>✓</Text>
            <Text style={[styles.pillarText, { color: themeColors.textSecondary }]}>
              Private
            </Text>
          </View>
          <Text style={[styles.pillarDot, { color: themeColors.textMuted }]}>•</Text>
          <View style={styles.pillarItem}>
            <Text style={[styles.pillarCheck, { color: themeColors.primary }]}>✓</Text>
            <Text style={[styles.pillarText, { color: themeColors.textSecondary }]}>
              Gentle
            </Text>
          </View>
          <Text style={[styles.pillarDot, { color: themeColors.textMuted }]}>•</Text>
          <View style={styles.pillarItem}>
            <Text style={[styles.pillarCheck, { color: themeColors.primary }]}>✓</Text>
            <Text style={[styles.pillarText, { color: themeColors.textSecondary }]}>
              Non-judgmental
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Progress Bar & Reassuring Copy */}
      <View style={styles.footer}>
        {/* Breathing Progress Bar */}
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: themeColors.secondaryAccent },
          ]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: themeColors.primary,
                width: progressWidth,
                marginLeft: progressMarginLeft,
              },
            ]}
          />
        </View>

        {/* Footer serene note */}
        <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
          A little peace, every day.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.marginMobile,
  },
  ambientTopGlow: {
    position: 'absolute',
    top: -60,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
  },
  ambientBottomGlow: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
  },
  topBar: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  topDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  emblemContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emblemHalo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  emblemCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotusIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  brandBadgeText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    ...Typography.display,
    fontFamily: FontFamilies.serif.regular,
    fontSize: 40,
    lineHeight: 46,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontFamily: FontFamilies.serif.italic,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  statement: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  pillarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillarCheck: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  pillarText: {
    ...Typography.labelSm,
    fontFamily: FontFamilies.sans.medium,
  },
  pillarDot: {
    marginHorizontal: 8,
    fontSize: 12,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  progressBarTrack: {
    width: 140,
    height: 5,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  footerText: {
    fontFamily: FontFamilies.serif.italic,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
