import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

export interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withTopInset?: boolean;
  withBottomInset?: boolean;
  backgroundColor?: string;
}

export function ScreenContainer({
  children,
  style,
  withTopInset = true,
  withBottomInset = false,
  backgroundColor,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();

  const containerBg = backgroundColor || themeColors.background;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: containerBg,
          paddingTop: withTopInset ? insets.top : 0,
          paddingBottom: withBottomInset ? insets.bottom : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

