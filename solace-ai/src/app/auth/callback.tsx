/**
 * Solace AI - OAuth Deep Link Callback Route
 *
 * Handles deep-link redirects for Supabase OAuth providers (Google).
 * Target URL: solaceai://auth/callback
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '@/context/ThemeContext';
import { authService, getOAuthRedirectUri } from '@/services/authService';
import { supabase } from '@/services/supabaseClient';
import { FontFamilies, Spacing, Typography } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const { themeColors } = useTheme();
  const searchParams = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    let isHandled = false;

    const processCallback = async () => {
      try {
        console.log('[Auth Stage 3: Supabase callback reached] AuthCallbackScreen route mounted');

        // 1. Direct param check from Expo Router route (PKCE code)
        if (searchParams.code && !isHandled) {
          isHandled = true;
          console.log('[Auth Stage 4: App redirect received] Route params contain authorization code. Delegating to authService');
          const baseUri = getOAuthRedirectUri();
          const separator = baseUri.includes('?') ? '&' : '?';
          const fullCallbackUrl = `${baseUri}${separator}code=${encodeURIComponent(searchParams.code)}`;
          const result = await authService.handleAuthCallbackUrl(fullCallbackUrl);
          if (result.success) {
            console.log('[Auth Stage 5: Session exchange completed] Routing to home sanctuary');
            router.replace('/(tabs)/home');
            return;
          }
        }

        // 2. Initial URL check from deep link
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && !isHandled) {
          isHandled = true;
          console.log('[Auth Stage 4: App redirect received] Deep link URL captured by Linking.getInitialURL');
          const result = await authService.handleAuthCallbackUrl(initialUrl);

          if (result.success) {
            console.log('[Auth Stage 5: Session exchange completed] Routing to home sanctuary');
            router.replace('/(tabs)/home');
            return;
          }
        }
      } catch (err: any) {
        console.warn('[Auth Stage: Exception] Error in AuthCallbackScreen:', err?.message || err);
      }

      // 3. Fallback: check if active session exists or wait briefly for in-flight exchange
      const persisted = await authService.getPersistedSession();
      if (persisted) {
        console.log('[Auth Stage 5: Session exchange completed] Active session found, navigating to home');
        router.replace('/(tabs)/home');
      } else {
        // Grace period (1.5s) to allow parallel in-flight browser/storage exchange to complete before redirecting
        const timer = setTimeout(async () => {
          const finalCheck = await authService.getPersistedSession();
          if (finalCheck) {
            console.log('[Auth Stage 5: Session exchange completed] Active session detected after grace period');
            router.replace('/(tabs)/home');
          } else {
            console.warn('[Auth Stage 5: Session exchange failed] No active session found. Returning to login.');
            router.replace('/login');
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    };

    processCallback();
  }, [searchParams.code]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.glowCircle, { backgroundColor: themeColors.blush }]}>
        <Text style={styles.lotusIcon}>🌿</Text>
      </View>
      <ActivityIndicator size="large" color={themeColors.primary} style={styles.spinner} />
      <Text style={[styles.title, { color: themeColors.text }]}>
        Connecting to Sanctuary
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Completing your secure sign in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  glowCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  lotusIcon: {
    fontSize: 36,
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamilies.serif.semiBold,
    fontSize: Typography.headlineMd.fontSize,
    lineHeight: Typography.headlineMd.lineHeight,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    textAlign: 'center',
  },
});
