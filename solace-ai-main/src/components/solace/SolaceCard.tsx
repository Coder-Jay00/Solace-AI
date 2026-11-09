import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface SolaceCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'tinted' | 'paper' | 'outlined';
  padding?: keyof typeof Spacing | number;
  radius?: keyof typeof Radii | number;
}

export function SolaceCard({
  children,
  style,
  variant = 'elevated',
  padding = 'lg',
  radius = 'card',
}: SolaceCardProps) {
  const { themeColors } = useTheme();

  const resolvedPadding = typeof padding === 'number' ? padding : Spacing[padding] ?? Spacing.lg;
  const resolvedRadius = typeof radius === 'number' ? radius : Radii[radius] ?? Radii.card;

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: themeColors.surfaceElevated,
          ...Shadows.card,
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case 'tinted':
        return {
          backgroundColor: themeColors.secondary,
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case 'paper':
        return {
          backgroundColor: themeColors.surface,
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: themeColors.border,
        };
      default:
        return {
          backgroundColor: themeColors.surface,
        };
    }
  };

  return (
    <View
      style={[
        styles.base,
        getVariantStyle(),
        {
          padding: resolvedPadding,
          borderRadius: resolvedRadius,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

