import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Colors, FontFamilies, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface SolaceHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  style?: ViewStyle;
}

export function SolaceHeader({
  title,
  subtitle,
  rightAction,
  leftAction,
  style,
}: SolaceHeaderProps) {
  const { themeColors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        {leftAction ? <View style={styles.actionLeft}>{leftAction}</View> : null}
        <View style={styles.titleWrapper}>
          <Text style={[styles.title, { color: themeColors.primary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction ? <View style={styles.actionRight}>{rightAction}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLeft: {
    marginRight: Spacing.md,
  },
  titleWrapper: {
    flex: 1,
  },
  actionRight: {
    marginLeft: Spacing.md,
  },
  title: {
    ...Typography.headlineLgMobile,
    fontFamily: FontFamilies.serif.medium,
  },
  subtitle: {
    ...Typography.bodySm,
    marginTop: 2,
    fontFamily: FontFamilies.sans.regular,
  },
});

