import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

// Complete any pending in-app browser sessions (OAuth redirects)
WebBrowser.maybeCompleteAuthSession();
import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_500Medium_Italic,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider as SolaceThemeProvider, useTheme } from '@/context/ThemeContext';
import { notificationService } from '@/services/notificationService';

// Prevent native splash screen from auto-hiding until custom fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

function NavigationRoot() {
  const { activeTheme, themeColors } = useTheme();
  const { user } = useAuth();

  // Initialize Android channels and set up tap listener
  useEffect(() => {
    notificationService.initChannels();

    let isMounted = true;
    const checkColdStart = async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (isMounted && lastResponse) {
          const route = notificationService.getDestinationForResponse(lastResponse);
          if (route) {
            setTimeout(() => {
              if (isMounted) router.push(route as any);
            }, 150);
          }
        }
      } catch (err) {
        console.warn('[NavigationRoot] Failed checking cold-start notification:', err);
      }
    };
    checkColdStart();

    let subscription: Notifications.EventSubscription | undefined;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const route = notificationService.getDestinationForResponse(response);
        if (route) {
          router.push(route as any);
        }
      });
    } catch (err) {
      console.warn('[NavigationRoot] Failed adding notification response listener:', err);
    }

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  // Reconcile scheduled reminders whenever active user changes
  useEffect(() => {
    notificationService.reconcileSchedules(user?.id).catch((err) => {
      console.warn('[NavigationRoot] Failed reconciling reminder schedules:', err);
    });
  }, [user?.id]);

  const navigationTheme = {
    dark: activeTheme === 'dark',
    colors: {
      ...(activeTheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: themeColors.primary,
      background: themeColors.background,
      card: themeColors.surface,
      text: themeColors.text,
      border: themeColors.border,
    },
    fonts: DefaultTheme.fonts,
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="mood-check-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="breathing" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="chat-history" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
        <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_500Medium_Italic,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <SolaceThemeProvider>
        <NavigationRoot />
      </SolaceThemeProvider>
    </AuthProvider>
  );
}
