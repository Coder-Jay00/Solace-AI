/**
 * Solace AI - Sky & Rose Design System Automated Verification Suite
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- 1. Verifying Theme Tokens in src/constants/theme.ts ---');
const themePath = './solace-ai/src/constants/theme.ts';
const themeContent = fs.readFileSync(themePath, 'utf8');

// Light tokens
assert(themeContent.includes("background: '#EAF2F8'"), 'Light background is #EAF2F8');
assert(themeContent.includes("surface: '#F9FBFD'"), 'Light surface is #F9FBFD');
assert(themeContent.includes("surfaceElevated: '#FFFFFF'"), 'Light surfaceElevated is #FFFFFF');
assert(themeContent.includes("primary: '#A85F72'"), 'Light primary is #A85F72 (Rose)');
assert(themeContent.includes("primaryPressed: '#914D60'"), 'Light primaryPressed is #914D60');
assert(themeContent.includes("onPrimary: '#FFFFFF'"), 'Light onPrimary is #FFFFFF');
assert(themeContent.includes("secondary: '#DCEAF2'"), 'Light secondary is #DCEAF2 (Powder Blue)');
assert(themeContent.includes("secondaryAccent: '#C7DCEB'"), 'Light secondaryAccent is #C7DCEB');
assert(themeContent.includes("blush: '#F1DFE2'"), 'Light blush is #F1DFE2');
assert(themeContent.includes("text: '#34495C'"), 'Light text is #34495C');
assert(themeContent.includes("textSecondary: '#758797'"), 'Light textSecondary is #758797');
assert(themeContent.includes("textMuted: '#91A0AD'"), 'Light textMuted is #91A0AD');
assert(themeContent.includes("border: '#D9E4EC'"), 'Light border is #D9E4EC');
assert(themeContent.includes("success: '#547B68'"), 'Light success is #547B68');
assert(themeContent.includes("warning: '#A97842'"), 'Light warning is #A97842');
assert(themeContent.includes("error: '#A44F5C'"), 'Light error is #A44F5C');
assert(themeContent.includes("tabBackground: '#F9FBFD'"), 'Light tabBackground is #F9FBFD');
assert(themeContent.includes("overlay: 'rgba(39, 57, 72, 0.32)'"), 'Light overlay is rgba(39, 57, 72, 0.32)');

// Dark tokens
assert(themeContent.includes("background: '#192A38'"), 'Dark background is #192A38');
assert(themeContent.includes("surface: '#243847'"), 'Dark surface is #243847');
assert(themeContent.includes("surfaceElevated: '#2D4353'"), 'Dark surfaceElevated is #2D4353');
assert(themeContent.includes("primary: '#D59AA7'"), 'Dark primary is #D59AA7 (Dusty Rose)');
assert(themeContent.includes("primaryPressed: '#E0AFB9'"), 'Dark primaryPressed is #E0AFB9');
assert(themeContent.includes("onPrimary: '#283541'"), 'Dark onPrimary is #283541 (Dark text contrast on rose)');
assert(themeContent.includes("secondary: '#344D5E'"), 'Dark secondary is #344D5E (Slate Blue)');
assert(themeContent.includes("secondaryAccent: '#405A6B'"), 'Dark secondaryAccent is #405A6B');
assert(themeContent.includes("blush: '#4B3944'"), 'Dark blush is #4B3944');
assert(themeContent.includes("text: '#F0F3F5'"), 'Dark text is #F0F3F5');
assert(themeContent.includes("textSecondary: '#B3C4D0'"), 'Dark textSecondary is #B3C4D0');
assert(themeContent.includes("textMuted: '#91A6B5'"), 'Dark textMuted is #91A6B5');
assert(themeContent.includes("border: '#3B5060'"), 'Dark border is #3B5060');
assert(themeContent.includes("success: '#91B8A3'"), 'Dark success is #91B8A3');
assert(themeContent.includes("warning: '#E0B477'"), 'Dark warning is #E0B477');
assert(themeContent.includes("error: '#E09AA4'"), 'Dark error is #E09AA4');
assert(themeContent.includes("tabBackground: '#243847'"), 'Dark tabBackground is #243847');
assert(themeContent.includes("overlay: 'rgba(5, 15, 23, 0.65)'"), 'Dark overlay is rgba(5, 15, 23, 0.65)');

// Radii
assert(themeContent.includes("card: 24"), 'Radii.card is 24');
assert(themeContent.includes("lg: 28"), 'Radii.lg is 28');
assert(themeContent.includes("xl: 32"), 'Radii.xl is 32');

// Shadows
assert(themeContent.includes("shadowColor: '#192A38'"), 'Shadows use slate shadowColor #192A38');
assert(themeContent.includes("shadowColor: '#A85F72'"), 'Shadows glow uses rose shadowColor #A85F72');

console.log('\n--- 2. Verifying Legacy Palette Clean-up in src/ ---');
const legacyColors = [
  '#8B78D8', '#6F59C7', '#2D1B69', '#1A0D3F', '#0B0024',
  '#F5F3FF', '#EDE9FE', '#DDD6FE', '#C4B5FD', '#A78BFA',
  '#23124E', '#2E1B5B', '#BA1A1A', '#FFEBEE', 'rgba(24, 0, 82'
];

let legacyFound = 0;
function scanLegacy(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      scanLegacy(full);
    } else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      const code = fs.readFileSync(full, 'utf8');
      legacyColors.forEach(c => {
        if (code.toLowerCase().includes(c.toLowerCase())) {
          console.error(`Legacy color ${c} found in ${full}`);
          legacyFound++;
        }
      });
    }
  }
}
scanLegacy('./solace-ai/src');
assert(legacyFound === 0, `Zero legacy purple/error residues in src/ (found: ${legacyFound})`);

console.log('\n--- 3. Verifying All App Screen Routes ---');
const expectedScreens = [
  './solace-ai/src/app/index.tsx',
  './solace-ai/src/app/onboarding.tsx',
  './solace-ai/src/app/login.tsx',
  './solace-ai/src/app/signup.tsx',
  './solace-ai/src/app/(tabs)/home.tsx',
  './solace-ai/src/app/(tabs)/companion.tsx',
  './solace-ai/src/app/(tabs)/insights.tsx',
  './solace-ai/src/app/(tabs)/profile.tsx',
  './solace-ai/src/app/mood-check-in.tsx',
  './solace-ai/src/app/breathing.tsx',
  './solace-ai/src/app/chat-history.tsx',
  './solace-ai/src/app/settings.tsx',
  './solace-ai/src/app/terms.tsx',
  './solace-ai/src/app/privacy.tsx',
];

expectedScreens.forEach(screen => {
  assert(fs.existsSync(screen), `Screen route exists: ${path.basename(screen)}`);
});

console.log(`\n========================================`);
console.log(`Total checks: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

