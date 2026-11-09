/**
 * Solace AI - Weekday Selector Component
 * Phase 7.6–7.8: Complete Local Notifications Implementation
 *
 * Sky & Rose pill selector for recurring weekday notifications.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FontFamilies, Radii, Spacing } from '@/constants/theme';
import { WEEKDAY_LABELS } from '@/types/notification';

interface WeekdaySelectorProps {
  selectedDays: number[]; // Array of 1-7 (1=Sun, 2=Mon, ..., 7=Sat)
  onToggleDay: (day: number) => void;
  disabled?: boolean;
}

export function WeekdaySelector({
  selectedDays,
  onToggleDay,
  disabled = false,
}: WeekdaySelectorProps) {
  const { themeColors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.textSecondary }]}>
        REPEATS ON
      </Text>
      <View style={styles.daysRow}>
        {WEEKDAY_LABELS.map((item) => {
          const isSelected = selectedDays.includes(item.day);
          return (
            <Pressable
              key={item.day}
              disabled={disabled}
              onPress={() => onToggleDay(item.day)}
              accessibilityRole="checkbox"
              accessibilityLabel={item.fullLabel}
              accessibilityState={{ checked: isSelected, disabled }}
              style={({ pressed }) => [
                styles.dayCircle,
                {
                  backgroundColor: isSelected ? themeColors.primary : themeColors.secondary,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                  opacity: disabled ? 0.5 : 1,
                },
                pressed && !disabled && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.dayText,
                  {
                    color: isSelected ? themeColors.onPrimary : themeColors.text,
                    fontFamily: isSelected ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                  },
                ]}>
                {item.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginTop: 4,
  },
  label: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});

