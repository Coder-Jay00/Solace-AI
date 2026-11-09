/**
 * Solace AI - Global Theme Context & Provider
 * Phase 7.5: Global Light and Dark Theme System
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type SolaceThemeColors = typeof Colors.light | typeof Colors.dark;

export interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: 'light' | 'dark';
  themeColors: SolaceThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@solace_theme_preference';
const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useNativeColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Restore persisted theme on launch
  useEffect(() => {
    let isMounted = true;
    const restoreTheme = async () => {
      try {
        const saved = await storage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
          if (isMounted) setThemeModeState(saved as ThemeMode);
        }
      } catch (err) {
        console.warn('[ThemeContext] Failed to restore theme:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };
    restoreTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await storage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('[ThemeContext] Failed to persist theme preference:', err);
    }
  };

  const activeTheme = useMemo<'light' | 'dark'>(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemScheme]);

  const themeColors = useMemo(() => {
    return Colors[activeTheme];
  }, [activeTheme]);

  const isDark = activeTheme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        themeColors,
        setThemeMode: handleSetThemeMode,
        isDark,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if invoked outside Provider
    const fallbackScheme = useNativeColorScheme();
    const active = fallbackScheme === 'dark' ? 'dark' : 'light';
    return {
      themeMode: 'system',
      activeTheme: active,
      themeColors: Colors[active],
      setThemeMode: async () => {},
      isDark: active === 'dark',
    };
  }
  return context;
}
