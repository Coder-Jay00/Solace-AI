import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { Colors, FontFamilies, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface SolaceButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glow' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function SolaceButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: SolaceButtonProps) {
  const { themeColors } = useTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: themeColors.primary,
            ...Shadows.card,
          },
          text: {
            color: themeColors.onPrimary,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: themeColors.secondary,
            borderWidth: 1,
            borderColor: themeColors.border,
          },
          text: {
            color: themeColors.text,
          },
        };
      case 'glow':
        return {
          container: {
            backgroundColor: themeColors.blush,
            ...Shadows.glow,
          },
          text: {
            color: themeColors.primary,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: themeColors.primary,
          },
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: themeColors.errorContainer,
            borderWidth: 1,
            borderColor: themeColors.error,
          },
          text: {
            color: themeColors.error,
          },
        };
      default:
        return {
          container: {
            backgroundColor: themeColors.primary,
          },
          text: {
            color: themeColors.onPrimary,
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
          },
          text: {
            fontSize: 13,
            lineHeight: 18,
          },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.xl,
          },
          text: {
            fontSize: 17,
            lineHeight: 24,
          },
        };
      case 'md':
      default:
        return {
          container: {
            paddingVertical: Spacing.sm + 4,
            paddingHorizontal: Spacing.lg,
          },
          text: {
            fontSize: 15,
            lineHeight: 20,
          },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.button,
        sizeStyle.container,
        variantStyle.container,
        pressed && !disabled && (variant === 'primary' ? { backgroundColor: themeColors.primaryPressed } : styles.pressed),
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? themeColors.onPrimary : themeColors.primary}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              sizeStyle.text,
              variantStyle.text,
              icon ? styles.textWithIcon : null,
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontFamily: FontFamilies.sans.bold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  textWithIcon: {
    marginLeft: Spacing.sm,
  },
});

