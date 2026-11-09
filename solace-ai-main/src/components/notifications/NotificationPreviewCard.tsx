/**
 * Solace AI - Notification Preview Card Component
 * Phase 7.6–7.8: Complete Local Notifications Implementation
 *
 * Demonstrates a static preview of how a Solace AI reminder looks on device.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FontFamilies, Radii, Shadows, Spacing } from '@/constants/theme';

export function NotificationPreviewCard() {
  const { themeColors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionHeading, { color: themeColors.textSecondary }]}>
        SAMPLE NOTIFICATION PREVIEW
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.surfaceElevated,
            borderColor: themeColors.border,
          },
          Shadows.card,
        ]}>
        {/* Banner Header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: themeColors.blush }]}>
            <Text style={styles.iconEmoji}>🌿</Text>
          </View>
          <Text style={[styles.appName, { color: themeColors.textSecondary }]}>
            Solace AI • Just now
          </Text>
        </View>

        {/* Message Content */}
        <View style={styles.contentBody}>
          <Text style={[styles.notifTitle, { color: themeColors.text }]}>Solace AI</Text>
          <Text style={[styles.notifBody, { color: themeColors.textSecondary }]}>
            A little moment for yourself. How are you feeling today?
          </Text>
        </View>

        {/* Action Prompt */}
        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: themeColors.primary }]}>
            Tap to open daily check-in →
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    marginTop: 4,
  },
  sectionHeading: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 12,
  },
  appName: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
  },
  contentBody: {
    gap: 2,
    paddingLeft: 2,
  },
  notifTitle: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 13,
  },
  notifBody: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    marginTop: 2,
  },
  footerRow: {
    paddingLeft: 2,
  },
  footerText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 11,
  },
});

