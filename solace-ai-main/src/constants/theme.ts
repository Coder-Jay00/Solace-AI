/**
 * Solace AI Theme & Design System
 * 
 * Sky & Rose Brand Identity — Morning Sky (Light) & Evening Sky (Dark)
 * Represents emotional comfort, compassion, calmness, openness, and welcoming sanctuary.
 */

import '@/global.css';
import { Platform } from 'react-native';

export const lightColors = {
  // Canvas & Surfaces (Morning Sky & Cloud White)
  background: '#EAF2F8',
  surface: '#F9FBFD',
  surfaceElevated: '#FFFFFF',
  canvasPaper: '#F9FBFD',
  surfaceLow: '#DCEAF2',
  surfaceSubtle: '#F1DFE2',
  surfaceHigh: '#FFFFFF',
  surfaceHighest: '#C7DCEB',

  // Primary Brand - Dusty Rose
  primary: '#A85F72',
  primaryPressed: '#914D60',
  primaryDark: '#7A3F50',
  primaryContainer: '#A85F72',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FFFFFF',

  // Secondary Brand - Powder Blue
  secondary: '#DCEAF2',
  secondaryAccent: '#C7DCEB',
  secondaryContainer: '#C7DCEB',
  onSecondary: '#34495C',
  onSecondaryContainer: '#34495C',

  // Emotional Warmth - Blush
  blush: '#F1DFE2',
  tertiary: '#A85F72',
  tertiaryDark: '#7A3F50',
  tertiaryContainer: '#F1DFE2',
  onTertiary: '#FFFFFF',

  // Neutrals & Typography (Dark Blue-Grey)
  text: '#34495C',
  textPrimary: '#34495C',
  textSecondary: '#758797',
  textMuted: '#91A0AD',
  border: '#D9E4EC',
  borderFocus: '#A85F72',

  // Functional & Feedback
  success: '#547B68',
  warning: '#A97842',
  error: '#A44F5C',
  onError: '#FFFFFF',
  errorContainer: '#FCEBEB',
  calmBlue: '#5C8EAF',
  warmSun: '#A97842',

  // Navigation & Overlays
  tabBackground: '#F9FBFD',
  overlay: 'rgba(39, 57, 72, 0.32)',

  // Compatibility aliases
  backgroundElement: '#DCEAF2',
  backgroundSelected: '#F1DFE2',
} as const;

export const darkColors = {
  // Canvas & Surfaces (Evening Sky & Layered Deep Cloud)
  background: '#192A38',
  surface: '#243847',
  surfaceElevated: '#2D4353',
  canvasPaper: '#243847',
  surfaceLow: '#344D5E',
  surfaceSubtle: '#4B3944',
  surfaceHigh: '#2D4353',
  surfaceHighest: '#405A6B',

  // Primary Brand - Soft Evening Rose
  primary: '#D59AA7',
  primaryPressed: '#E0AFB9',
  primaryDark: '#B87E8C',
  primaryContainer: '#D59AA7',
  onPrimary: '#283541',
  onPrimaryContainer: '#283541',

  // Secondary Brand - Slate Blue
  secondary: '#344D5E',
  secondaryAccent: '#405A6B',
  secondaryContainer: '#405A6B',
  onSecondary: '#F0F3F5',
  onSecondaryContainer: '#F0F3F5',

  // Emotional Warmth - Deep Blush
  blush: '#4B3944',
  tertiary: '#D59AA7',
  tertiaryDark: '#B87E8C',
  tertiaryContainer: '#4B3944',
  onTertiary: '#283541',

  // Neutrals & Typography
  text: '#F0F3F5',
  textPrimary: '#F0F3F5',
  textSecondary: '#B3C4D0',
  textMuted: '#91A6B5',
  border: '#3B5060',
  borderFocus: '#D59AA7',

  // Functional & Feedback
  success: '#91B8A3',
  warning: '#E0B477',
  error: '#E09AA4',
  onError: '#283541',
  errorContainer: '#4A252B',
  calmBlue: '#7EA8C5',
  warmSun: '#E0B477',

  // Navigation & Overlays
  tabBackground: '#243847',
  overlay: 'rgba(5, 15, 23, 0.65)',

  // Compatibility aliases
  backgroundElement: '#344D5E',
  backgroundSelected: '#4B3944',
} as const;

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;

export type ThemeColors = typeof Colors.light;
export type ThemeColor = keyof typeof Colors.light;

/**
 * Typography Families
 * - Headings: Newsreader (Editorial Serif)
 * - Body & UI: Manrope (Clean Humanist Sans)
 */
export const FontFamilies = {
  serif: {
    regular: 'Newsreader_400Regular',
    italic: 'Newsreader_400Regular_Italic',
    medium: 'Newsreader_500Medium',
    mediumItalic: 'Newsreader_500Medium_Italic',
    semiBold: 'Newsreader_600SemiBold',
    bold: 'Newsreader_700Bold',
  },
  sans: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: FontFamilies.sans.regular,
    serif: FontFamilies.serif.regular,
    rounded: FontFamilies.sans.medium,
    mono: 'ui-monospace',
  },
  default: {
    sans: FontFamilies.sans.regular,
    serif: FontFamilies.serif.regular,
    rounded: FontFamilies.sans.medium,
    mono: 'monospace',
  },
  web: {
    sans: FontFamilies.sans.regular,
    serif: FontFamilies.serif.regular,
    rounded: FontFamilies.sans.medium,
    mono: 'monospace',
  },
});

/**
 * Editorial Typography Scale for Sky & Rose Design System
 */
export const Typography = {
  display: {
    fontFamily: FontFamilies.serif.regular,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.015 * 36,
  },
  headlineLg: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.01 * 30,
  },
  headlineLgMobile: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.01 * 26,
  },
  headlineMd: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.005 * 22,
  },
  headlineSm: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  bodyLg: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 16,
    lineHeight: 26,
  },
  bodyMd: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13.5,
    lineHeight: 20,
  },
  labelLg: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.01 * 14,
  },
  labelMd: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.02 * 12,
  },
  labelSm: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.03 * 11,
  },
} as const;

/**
 * Spacing Scale
 */
export const Spacing = {
  xs: 4,      // 0.25rem
  sm: 8,      // 0.5rem
  md: 16,     // 1.0rem
  lg: 24,     // 1.5rem
  xl: 40,     // 2.5rem
  '2xl': 56,  // 3.5rem
  '3xl': 64,  // 4.0rem
  gutterMobile: 12, // 0.75rem
  marginMobile: 20, // 1.25rem
  margin: 32,       // 2.0rem

  // Legacy scale aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 48,
  eight: 64,
  nine: 80,
  ten: 96,
  eleven: 128,
  twelve: 160,
} as const;

/**
 * Border Radii (Sky & Rose Soft Geometry)
 * Standard cards: 24px, Hero: 30px
 */
export const Radii = {
  sm: 8,       // 0.5rem
  md: 16,      // 1.0rem
  card: 24,    // Standard comfortable card radius (22–28 px)
  lg: 28,      // 1.75rem (Dialogs, prominent containers)
  xl: 32,      // 2.0rem (Hero containers, large prompt modules)
  full: 9999,  // Pills, buttons, chips, toggles
} as const;

/**
 * Sky & Rose Restrained Ambient Shadows
 * Soft slate/evening-sky shadow tone; no harsh, neon, or purple glows.
 */
export const Shadows = {
  card: {
    shadowColor: '#192A38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  floating: {
    shadowColor: '#192A38',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#A85F72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
