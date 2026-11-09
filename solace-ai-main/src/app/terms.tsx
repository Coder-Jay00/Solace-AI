/**
 * Solace AI - Terms of Service
 * Phase 7.5: Legal Consent & Disclosure
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/solace/ScreenContainer';
import { FontFamilies, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export default function TermsOfServiceScreen() {
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
          Terms of Service
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        <View style={[styles.badge, { backgroundColor: themeColors.secondary }]}>
          <Text style={[styles.badgeText, { color: themeColors.primary }]}>
            Draft Version 1.0.0 — Demonstration Phase
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: themeColors.textSecondary }]}>
          Effective Date: November 2026
        </Text>

        <View style={[styles.noticeCard, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.warning }]}>
          <Text style={[styles.noticeTitle, { color: themeColors.warning }]}>
            Draft Agreement Notice
          </Text>
          <Text style={[styles.noticeText, { color: themeColors.text }]}>
            These Terms of Service represent a demonstration draft agreement for prototype and testing purposes. Formal professional legal counsel must review and approve these terms prior to public commercial release.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            1. Nature of the Service
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            Solace AI is a personal self-care, reflection, and mindfulness tool designed to support day-to-day emotional awareness, breathing routines, and mindful journaling.
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            <Text style={{ fontFamily: FontFamilies.sans.bold }}>
              Solace AI is not a medical device, mental health clinic, suicide prevention service, or provider of psychotherapy, psychiatric treatment, diagnosis, or clinical advice.
            </Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            2. AI Companion Disclaimer
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            The AI Companion within Solace is an automated conversational system designed for guided journaling, empathetic listening, and reflective prompts. The AI Companion is not a licensed clinician, psychologist, doctor, or certified counselor.
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            Never use Solace or the AI Companion in place of qualified professional healthcare, medical diagnosis, or psychological treatment. If you are experiencing a mental health crisis, self-harm thoughts, or severe emotional distress, please seek immediate emergency assistance:
          </Text>
          <View style={[styles.crisisBox, { backgroundColor: themeColors.secondary, borderColor: themeColors.border }]}>
            <Text style={[styles.crisisText, { color: themeColors.text }]}>
              • United States & Canada: Call or text <Text style={{ fontFamily: FontFamilies.sans.bold }}>988</Text> (Suicide & Crisis Lifeline)
            </Text>
            <Text style={[styles.crisisText, { color: themeColors.text }]}>
              • United Kingdom: Call <Text style={{ fontFamily: FontFamilies.sans.bold }}>111</Text> or <Text style={{ fontFamily: FontFamilies.sans.bold }}>999</Text>
            </Text>
            <Text style={[styles.crisisText, { color: themeColors.text }]}>
              • International Resources: Visit <Text style={{ fontFamily: FontFamilies.sans.bold }}>findahelpline.com</Text>
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            3. Local-First Demonstration Storage
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            In this prototype phase, all personal data—including mood entries, breathing logs, companion messages, and preferences—is stored locally on your device using AsyncStorage.
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            Accounts and sessions created in this phase are temporary demonstration accounts. Passwords are never saved in plaintext or persisted to disk. Clearing app data or selecting "Clear All Local Data" in Settings will erase your local records.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            4. User Responsibilities
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            By using Solace AI, you acknowledge and agree that:
          </Text>
          <Text style={[styles.bullet, { color: themeColors.text }]}>
            • You are at least 18 years of age or have parental/guardian consent.
          </Text>
          <Text style={[styles.bullet, { color: themeColors.text }]}>
            • You will not use the service to generate harmful, abusive, or illegal material.
          </Text>
          <Text style={[styles.bullet, { color: themeColors.text }]}>
            • You understand that local device backups and device physical security are your responsibility.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
            5. Limitation of Liability
          </Text>
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            To the fullest extent permitted by applicable law, Solace AI and its creators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of or inability to use the service, including any reliance on AI responses or self-care exercises.
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Done reading Terms of Service"
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
    marginBottom: 6,
    paddingLeft: Spacing.xs,
  },
  crisisBox: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  crisisText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
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

