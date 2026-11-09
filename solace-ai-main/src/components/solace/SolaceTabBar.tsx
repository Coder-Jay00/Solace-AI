import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamilies, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface TabItem {
  name: string;
  route: '/(tabs)/home' | '/(tabs)/companion' | '/(tabs)/insights' | '/(tabs)/profile';
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { name: 'home', route: '/(tabs)/home', label: 'Home', icon: '✦' },
  { name: 'companion', route: '/(tabs)/companion', label: 'Companion', icon: '💬' },
  { name: 'insights', route: '/(tabs)/insights', label: 'Insights', icon: '📊' },
  { name: 'profile', route: '/(tabs)/profile', label: 'Sanctuary', icon: '🌿' },
];

export function SolaceTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Hide tab bar when keyboard is active on mobile to prevent layout collision with composer
  if (isKeyboardVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.tabBackground,
          borderTopColor: themeColors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = pathname.includes(tab.name) || (pathname === '/' && tab.name === 'home');

          return (
            <Pressable
              key={tab.name}
              onPress={() => router.push(tab.route)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.tabPressed,
              ]}>
              <View
                style={[
                  styles.iconContainer,
                  isActive && {
                    backgroundColor: themeColors.blush,
                    borderRadius: Radii.full,
                  },
                ]}>
                <Text
                  style={[
                    styles.tabIcon,
                    {
                      color: isActive ? themeColors.primary : themeColors.textSecondary,
                    },
                  ]}>
                  {tab.icon}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? themeColors.primary : themeColors.textSecondary,
                    fontFamily: isActive ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                  },
                ]}>
                {tab.label}
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
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    ...Shadows.card,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});

