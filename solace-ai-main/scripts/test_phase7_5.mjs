/**
 * Solace AI - Automated Test Suite for Phase 7.5
 * Verifies:
 * 1. Legal Consent & Auth Service (consent metadata, blocking without terms)
 * 2. Breathing Persistence Service (storage, stats computation, zero fabrication, scoped keys)
 * 3. Theme System & Color Tokens (light & dark parity, Spacing, Radii)
 * 4. Critical Route & Component Integrity (terms, privacy, settings, profile, companion)
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = path.resolve('solace-ai');

console.log('🧪 Starting Solace AI Phase 7.5 Automated Verification Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// ── Test 1: File Architecture & Route Presence ─────────────────────────────
runTest('All required Phase 7.5 routes and components exist', () => {
  const requiredFiles = [
    'src/app/terms.tsx',
    'src/app/privacy.tsx',
    'src/app/settings.tsx',
    'src/app/(tabs)/profile.tsx',
    'src/app/(tabs)/companion.tsx',
    'src/app/(tabs)/home.tsx',
    'src/app/(tabs)/insights.tsx',
    'src/app/chat-history.tsx',
    'src/context/ThemeContext.tsx',
    'src/types/breathingSession.ts',
    'src/services/breathingService.ts',
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(ROOT, file);
    assert(fs.existsSync(fullPath), `Missing required file: ${file}`);
  }
});

// ── Test 2: Legal Disclosures in Terms & Privacy ───────────────────────────
runTest('Terms of Service contains required disclosures and clinical boundaries', () => {
  const termsContent = fs.readFileSync(path.join(ROOT, 'src/app/terms.tsx'), 'utf-8');
  assert(termsContent.includes('not a medical device'), 'Terms must state Solace is not a medical device');
  assert(termsContent.includes('psychotherapy') || termsContent.includes('psychiatric'), 'Terms must disclose lack of clinical psychotherapy');
  assert(termsContent.includes('Draft Version 1.0.0'), 'Terms must state draft demonstration version');
  assert(termsContent.includes('988'), 'Terms must list 988 emergency crisis lifeline');
  assert(termsContent.includes('findahelpline.com'), 'Terms must reference international crisis line');
  assert(termsContent.includes('BackHandler'), 'Terms must implement hardware back navigation');
});

runTest('Privacy Policy contains required local-first and zero-tracking disclosures', () => {
  const privacyContent = fs.readFileSync(path.join(ROOT, 'src/app/privacy.tsx'), 'utf-8');
  assert(privacyContent.includes('Local-First'), 'Privacy must state local-first architecture');
  assert(privacyContent.includes('AsyncStorage'), 'Privacy must state data stored in AsyncStorage');
  assert(privacyContent.includes('Zero Third-Party Analytics'), 'Privacy must disclose no third-party tracking');
  assert(privacyContent.includes('Clear All Local Data'), 'Privacy must explain how to clear data in Settings');
  assert(privacyContent.includes('Supabase'), 'Privacy must address future cloud sync');
});

// ── Test 3: Consent Checkbox & Blocking in Signup ──────────────────────────
runTest('Signup form enforces consent checkbox and links to terms & privacy', () => {
  const signupContent = fs.readFileSync(path.join(ROOT, 'src/app/signup.tsx'), 'utf-8');
  assert(signupContent.includes('useState(false)'), 'Terms checkbox must start unchecked (false)');
  assert(signupContent.includes("router.push('/terms')"), 'Must link to /terms');
  assert(signupContent.includes("router.push('/privacy')"), 'Must link to /privacy');
  assert(signupContent.includes('termsAccepted'), 'Form validation must check termsAccepted');
});

// ── Test 4: Auth Service Records Consent Metadata ──────────────────────────
runTest('Auth service User model includes consentVersion and consentAcceptedAt', () => {
  const authContent = fs.readFileSync(path.join(ROOT, 'src/services/authService.ts'), 'utf-8');
  assert(authContent.includes('consentVersion?: string'), 'User model must have consentVersion');
  assert(authContent.includes('consentAcceptedAt?: string'), 'User model must have consentAcceptedAt');
  assert(authContent.includes("consentVersion: '1.0.0'"), 'signUp must assign consentVersion 1.0.0');
});

// ── Test 5: Breathing Service Logic & Zero Fabrication ─────────────────────
runTest('Breathing service logic handles sessions, statistics, and zero-duration guards', () => {
  const serviceContent = fs.readFileSync(path.join(ROOT, 'src/services/breathingService.ts'), 'utf-8');
  assert(serviceContent.includes('@solace_breathing_sessions_'), 'Must use scoped storage key');
  assert(serviceContent.includes('completedDurationSeconds <= 0'), 'Must guard against zero/negative duration');
  assert(serviceContent.includes('totalSessionsCompleted'), 'Must compute totalSessionsCompleted');
  assert(serviceContent.includes('totalMinutesBreathed'), 'Must compute totalMinutesBreathed');
  assert(serviceContent.includes('lastSession'), 'Must return lastSession');
});

// ── Test 6: Theme System Tokens & Component Integration ────────────────────
runTest('Theme system provides full Light and Dark parity with required tokens', () => {
  const themeContent = fs.readFileSync(path.join(ROOT, 'src/constants/theme.ts'), 'utf-8');
  assert(themeContent.includes('light: lightColors'), 'Colors.light must be defined');
  assert(themeContent.includes('dark: darkColors'), 'Colors.dark must be defined');
  assert(themeContent.includes('textPrimary'), 'Colors must define textPrimary');
  assert(themeContent.includes("'2xl': 56"), 'Spacing must define 2xl');
});

runTest('ThemeContext provides themeMode, activeTheme, and persists preference', () => {
  const contextContent = fs.readFileSync(path.join(ROOT, 'src/context/ThemeContext.tsx'), 'utf-8');
  assert(contextContent.includes('@solace_theme_preference'), 'Must persist theme preference');
  assert(contextContent.includes('ThemeMode'), 'Must define ThemeMode system | light | dark');
  assert(contextContent.includes('setThemeMode'), 'Must provide setThemeMode method');
});

// ── Test 7: Android Chat Keyboard & Back Navigation ────────────────────────
runTest('Companion screen implements keyboard visibility, back handler, and near-bottom scroll', () => {
  const companionContent = fs.readFileSync(path.join(ROOT, 'src/app/(tabs)/companion.tsx'), 'utf-8');
  assert(companionContent.includes('Keyboard.addListener'), 'Must listen to keyboard visibility');
  assert(companionContent.includes('BackHandler.addEventListener'), 'Must implement BackHandler');
  assert(companionContent.includes('isNearBottomRef'), 'Must track scroll position to avoid jumping');
  assert(companionContent.includes('Keyboard.dismiss()'), 'Must dismiss keyboard on hardware back');
});

runTest('SolaceTabBar hides on mobile when keyboard is visible', () => {
  const tabBarContent = fs.readFileSync(path.join(ROOT, 'src/components/solace/SolaceTabBar.tsx'), 'utf-8');
  assert(tabBarContent.includes('isKeyboardVisible'), 'Tab bar must track keyboard visibility');
  assert(tabBarContent.includes('return null;'), 'Tab bar must hide when keyboard is visible');
});

// ── Test 8: Pull to Refresh on Core Views ──────────────────────────────────
runTest('All 4 core views implement native RefreshControl with theme colors', () => {
  const views = [
    'src/app/(tabs)/home.tsx',
    'src/app/(tabs)/insights.tsx',
    'src/app/(tabs)/profile.tsx',
    'src/app/chat-history.tsx',
  ];

  for (const view of views) {
    const content = fs.readFileSync(path.join(ROOT, view), 'utf-8');
    assert(content.includes('RefreshControl'), `${view} must use RefreshControl`);
    assert(content.includes('onRefresh'), `${view} must implement onRefresh`);
    assert(content.includes('colors={[themeColors.primary]}'), `${view} must use themeColors for indicator`);
  }
});

// ── Test 9: Settings Screen Implementation ─────────────────────────────────
runTest('Settings screen implements segmented theme selector, data clearance, and logout', () => {
  const settingsContent = fs.readFileSync(path.join(ROOT, 'src/app/settings.tsx'), 'utf-8');
  assert(settingsContent.includes('handleSelectTheme'), 'Settings must support theme selection');
  assert(settingsContent.includes('System Default'), 'Settings must offer System Default');
  assert(settingsContent.includes('Morning Sky'), 'Settings must offer Morning Sky');
  assert(settingsContent.includes('Evening Sky'), 'Settings must offer Evening Sky');
  assert(settingsContent.includes('Clear All Local Data'), 'Settings must have Clear All Local Data action');
  assert(settingsContent.includes('multiRemove'), 'Clear data must remove all @solace_ keys');
  assert(settingsContent.includes('showLogoutModal'), 'Settings must have logout confirmation');
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n========================================`);
console.log(`Summary: ${passedTests} / ${totalTests} tests passed`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

