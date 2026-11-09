/**
 * Solace AI - Privacy Policy
 * Phase 7.5: Privacy Disclosure & Data Management
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/solace/ScreenContainer';
import { FontFamilies, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { themeColors, isDark } = useTheme();

  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  return (
    <ScreenContainer withTopInset withBottomInset>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, { backgroundColor: themeColors.secondary }, pressed && styles.pressed]}>
          <Text style={[styles.backIcon, { color: themeColors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeColors.primary }]}>
          Privacy Policy
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        <View style={[styles.badge, { backgroundColor: themeColors.secondary }]}>
          <Text style={[styles.badgeText, { color: themeColors.primary }]}>
            Draft Version 1.0.0 — Local-First Prototype
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: themeColors.textSecondary }]}>
          Effective Date: November 2026
        </Text>

        <View style={[styles.noticeCard, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.warning }]}>
          <Text style={[styles.noticeTitle, { color: themeColors.warning }]}>
            Draft Policy Notice
          </Text>
          <Text style={[styles.noticeText, { color: themeColors.text }]}>
            This Privacy Policy is a demonstration draft for development and testing. Formal legal review must be conducted prior to commercial app store release.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            1. Core Principle: Local-First Architecture
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            Solace AI is designed with a sanctuary-first privacy approach. In this demonstration phase, your emotional records, conversations, and personal statistics stay entirely on your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            2. Exact Data Collected & Stored Locally
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            All personal information is stored locally via React Native AsyncStorage and is scoped to your active demonstration profile:
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
            <Text style={[styles.itemHeader, { color: themeColors.primary }]}>
              • Mood Check-In Records:
            </Text>
            <Text style={[styles.itemBody, { color: themeColors.textSecondary }]}>
              Selected mood category (Calm, Reflective, Anxious, Low, Grateful, Overwhelmed), emotional energy level, optional reflection tags, timestamp, and optional private journaling notes.
            </Text>

            <Text style={[styles.itemHeader, { color: themeColors.primary }]}>
              • Companion Chat History:
            </Text>
            <Text style={[styles.itemBody, { color: themeColors.textSecondary }]}>
              Conversational exchange messages, thread IDs, timestamps, and active message states.
            </Text>

            <Text style={[styles.itemHeader, { color: themeColors.primary }]}>
              • Guided Breathing Session Records:
            </Text>
            <Text style={[styles.itemBody, { color: themeColors.textSecondary }]}>
              Breathing pattern name (e.g., Box Breathing 4-4-4-4, 4-7-8 Relaxing, Gentle Exhale), target duration, completed duration in seconds, cycles finished, and session completion timestamp.
            </Text>

            <Text style={[styles.itemHeader, { color: themeColors.primary }]}>
              • Application Preferences:
            </Text>
            <Text style={[styles.itemBody, { color: themeColors.textSecondary }]}>
              Color theme preference (System Default, Light, Dark) and onboarding completion status.
            </Text>

            <Text style={[styles.itemHeader, { color: themeColors.primary }]}>
              • Demonstration Profile:
            </Text>
            <Text style={[styles.itemBody, { color: themeColors.textSecondary }]}>
              Your display name, normalized email address, account creation timestamp, and legal consent acceptance timestamp. Passwords are never saved to storage.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            3. Zero Third-Party Analytics or Advertising
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            Solace AI does NOT contain third-party ad networks, telemetry trackers, marketing SDKs, or behavioral profiling tools. Your wellness data is never sold, shared, or monetized.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            4. How to Clear or Export Your Data
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            You have complete sovereignty over your data:
          </Text>
          <Text style={[styles.bullet, { color: themeColors.text }]}>
            • <Text style={{ fontFamily: FontFamilies.sans.bold }}>Settings Screen:</Text> Open Settings from Sanctuary/Profile and tap "Clear All Local Data" to immediately wipe all moods, breathing sessions, and chat history.
          </Text>
          <Text style={[styles.bullet, { color: themeColors.text }]}>
            • <Text style={{ fontFamily: FontFamilies.sans.bold }}>Device Application Settings:</Text> Clearing the Solace AI storage cache from your Android or iOS system settings will remove all local AsyncStorage keys.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            5. Future Cloud Backend & Synchronization
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            In future releases featuring cloud sync (e.g., Supabase), cloud persistence will be strictly opt-in with secure authenticated transport, row-level security (RLS), and explicit privacy consent prior to any cloud transmission.
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Done reading Privacy Policy"
          style={({ pressed }) => [
            styles.doneButton,
            { backgroundColor: themeColors.primary },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.doneButtonText, { color: themeColors.onPrimary }]}>Done Reading</Text>
        </Pressable>
      </ScrollView>
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
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 12,
  },
  lastUpdated: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noticeTitle: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noticeText: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: FontFamilies.serif.semiBold,
    fontSize: 17,
    marginBottom: Spacing.xs,
  },
  paragraph: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  bullet: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: Spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 2,
  },
  itemBody: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  doneButton: {
    marginTop: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});

