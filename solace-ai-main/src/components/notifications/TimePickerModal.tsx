/**
 * Solace AI - Time Picker Modal Component
 * Phase 7.6–7.8: Complete Local Notifications Implementation
 *
 * Custom Sky & Rose time picker designed for gentle wellness routines.
 * Zero external dependencies; fully cross-platform and theme-aware.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FontFamilies, Radii, Shadows, Spacing } from '@/constants/theme';

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  initialHour: number; // 0-23
  initialMinute: number; // 0-59
  onSave: (hour: number, minute: number) => void;
  onClose: () => void;
}

const PRESETS = [
  { label: 'Morning (8:30 AM)', hour: 8, minute: 30 },
  { label: 'Midday (12:30 PM)', hour: 12, minute: 30 },
  { label: 'Afternoon (2:00 PM)', hour: 14, minute: 0 },
  { label: 'Evening (7:00 PM)', hour: 19, minute: 0 },
  { label: 'Night (10:00 PM)', hour: 22, minute: 0 },
];

export function TimePickerModal({
  visible,
  title,
  initialHour,
  initialMinute,
  onSave,
  onClose,
}: TimePickerModalProps) {
  const { themeColors } = useTheme();

  const [hour12, setHour12] = useState<number>(8);
  const [minute, setMinute] = useState<number>(0);
  const [isPm, setIsPm] = useState<boolean>(false);

  // Sync state whenever modal opens or initial values change
  useEffect(() => {
    if (visible) {
      const pm = initialHour >= 12;
      const h12 = initialHour % 12 === 0 ? 12 : initialHour % 12;
      setHour12(h12);
      setMinute(initialMinute);
      setIsPm(pm);
    }
  }, [visible, initialHour, initialMinute]);

  const handleHourChange = (delta: number) => {
    let next = hour12 + delta;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setHour12(next);
  };

  const handleMinuteChange = (delta: number) => {
    let next = minute + delta;
    if (next >= 60) next = 0;
    if (next < 0) next = 55;
    setMinute(next);
  };

  const handlePresetSelect = (presetHour: number, presetMin: number) => {
    const pm = presetHour >= 12;
    const h12 = presetHour % 12 === 0 ? 12 : presetHour % 12;
    setHour12(h12);
    setMinute(presetMin);
    setIsPm(pm);
  };

  const handleSave = () => {
    const h24 = (hour12 % 12) + (isPm ? 12 : 0);
    onSave(h24, minute);
  };

  const formattedMinute = String(minute).padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: themeColors.overlay }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border },
            Shadows.floating,
          ]}>
          <Text style={[styles.title, { color: themeColors.primary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Select a serene time for your daily reminder.
          </Text>

          {/* Time Display & Steppers */}
          <View style={[styles.timeBox, { backgroundColor: themeColors.surfaceLow }]}>
            {/* Hour Column */}
            <View style={styles.timeColumn}>
              <Pressable
                onPress={() => handleHourChange(1)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                <Text style={[styles.stepperArrow, { color: themeColors.primary }]}>▲</Text>
              </Pressable>
              <Text style={[styles.timeNumber, { color: themeColors.text }]}>
                {String(hour12).padStart(2, '0')}
              </Text>
              <Pressable
                onPress={() => handleHourChange(-1)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                <Text style={[styles.stepperArrow, { color: themeColors.primary }]}>▼</Text>
              </Pressable>
              <Text style={[styles.columnLabel, { color: themeColors.textSecondary }]}>HOUR</Text>
            </View>

            <Text style={[styles.colon, { color: themeColors.primary }]}>:</Text>

            {/* Minute Column */}
            <View style={styles.timeColumn}>
              <Pressable
                onPress={() => handleMinuteChange(5)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                <Text style={[styles.stepperArrow, { color: themeColors.primary }]}>▲</Text>
              </Pressable>
              <Text style={[styles.timeNumber, { color: themeColors.text }]}>
                {formattedMinute}
              </Text>
              <Pressable
                onPress={() => handleMinuteChange(-5)}
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                <Text style={[styles.stepperArrow, { color: themeColors.primary }]}>▼</Text>
              </Pressable>
              <Text style={[styles.columnLabel, { color: themeColors.textSecondary }]}>MIN</Text>
            </View>

            {/* AM / PM Toggle */}
            <View style={styles.ampmColumn}>
              <Pressable
                onPress={() => setIsPm(false)}
                style={[
                  styles.ampmBtn,
                  {
                    backgroundColor: !isPm ? themeColors.primary : themeColors.secondary,
                  },
                ]}>
                <Text
                  style={[
                    styles.ampmText,
                    { color: !isPm ? themeColors.onPrimary : themeColors.text },
                  ]}>
                  AM
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setIsPm(true)}
                style={[
                  styles.ampmBtn,
                  {
                    backgroundColor: isPm ? themeColors.primary : themeColors.secondary,
                  },
                ]}>
                <Text
                  style={[
                    styles.ampmText,
                    { color: isPm ? themeColors.onPrimary : themeColors.text },
                  ]}>
                  PM
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Presets */}
          <Text style={[styles.presetSectionHeading, { color: themeColors.textSecondary }]}>
            RECOMMENDED TIMES
          </Text>
          <View style={styles.presetsRow}>
            {PRESETS.map((p) => {
              const currentH24 = (hour12 % 12) + (isPm ? 12 : 0);
              const isSelected = currentH24 === p.hour && minute === p.minute;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => handlePresetSelect(p.hour, p.minute)}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isSelected ? themeColors.blush : themeColors.secondary,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.presetText,
                      { color: isSelected ? themeColors.primary : themeColors.text },
                    ]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: themeColors.secondary }]}>
              <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: themeColors.primary }]}>
              <Text style={[styles.saveBtnText, { color: themeColors.onPrimary }]}>
                Save Time
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
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  title: {
    fontFamily: FontFamilies.serif.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -4,
  },
  timeBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.lg,
    gap: 12,
  },
  timeColumn: {
    alignItems: 'center',
    width: 64,
  },
  stepperBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  stepperArrow: {
    fontSize: 16,
  },
  timeNumber: {
    fontFamily: FontFamilies.sans.extraBold,
    fontSize: 32,
    marginVertical: 2,
  },
  colon: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 32,
    marginTop: -16,
  },
  columnLabel: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  ampmColumn: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 13,
  },
  presetSectionHeading: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  presetText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.6,
  },
});

