import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { FontFamilies, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export function LoadingIndicator({
  message,
  size = 'large',
  style,
}: LoadingIndicatorProps) {
  const { themeColors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={themeColors.primary} />
      {message ? (
        <Text style={[styles.message, { color: themeColors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.medium,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

