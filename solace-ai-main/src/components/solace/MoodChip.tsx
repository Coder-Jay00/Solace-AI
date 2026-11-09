import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamilies, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface MoodChipProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function MoodChip({
  label,
  emoji,
  selected = false,
  onPress,
  style,
}: MoodChipProps) {
  const { themeColors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? themeColors.primary : themeColors.surface,
          borderColor: selected ? themeColors.primary : themeColors.border,
          ...(selected ? Shadows.glow : {}),
        },
        pressed && styles.pressed,
        style,
      ]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text
        style={[
          styles.label,
          {
            color: selected ? themeColors.onPrimary : themeColors.text,
            fontFamily: selected ? FontFamilies.sans.bold : FontFamilies.sans.medium,
          },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});

