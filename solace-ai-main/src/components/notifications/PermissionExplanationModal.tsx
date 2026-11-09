/**
 * Solace AI - Permission Explanation Modal Component
 * Phase 7.6–7.8: Complete Local Notifications Implementation
 *
 * Explains local-only notification privacy and provides direct link to OS Settings.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FontFamilies, Radii, Shadows, Spacing } from '@/constants/theme';

interface PermissionExplanationModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestAgain?: () => void;
}

export function PermissionExplanationModal({
  visible,
  onClose,
  onRequestAgain,
}: PermissionExplanationModalProps) {
  const { themeColors } = useTheme();

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('[PermissionModal] Failed to open device settings:', err);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: themeColors.overlay }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
            Shadows.floating,
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: themeColors.blush }]}>
            <Text style={styles.iconEmoji}>🔔</Text>
          </View>

          <Text style={[styles.title, { color: themeColors.primary }]}>
            Notification Permission
          </Text>

          <Text style={[styles.body, { color: themeColors.text }]}>
            Solace AI uses notifications exclusively for your scheduled local wellness reminders (such as mood check-ins and breathing pauses).
          </Text>

          <View style={[styles.privacyBox, { backgroundColor: themeColors.surfaceLow }]}>
            <Text style={[styles.privacyText, { color: themeColors.textSecondary }]}>
              🔒 <Text style={{ fontFamily: FontFamilies.sans.bold }}>100% Private & Local:</Text> Reminders never leave your device. We do not track you or send remote promotional alerts.
            </Text>
          </View>

          <Text style={[styles.instructions, { color: themeColors.textSecondary }]}>
            To receive your gentle invitations, please enable notifications for Solace AI in your device settings.
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: themeColors.secondary }]}>
              <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>
                Not Now
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenSettings}
              style={[styles.actionBtn, { backgroundColor: themeColors.primary }]}>
              <Text style={[styles.actionBtnText, { color: themeColors.onPrimary }]}>
                Open Settings
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.marginMobile,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconEmoji: {
    fontSize: 24,
  },
  title: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  privacyBox: {
    borderRadius: Radii.md,
    padding: Spacing.sm,
    width: '100%',
  },
  privacyText: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  instructions: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 14,
  },
});

