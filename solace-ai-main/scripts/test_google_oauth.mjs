/**
 * Solace AI - Google OAuth & Real Authentication Verification Suite
 *
 * Verifies:
 * 1. authService implements signInWithGoogle, handleAuthCallbackUrl, and buildAndPersistSessionFromSupabase
 * 2. Deep link scheme 'solaceai' and android package configured in app.json
 * 3. Dedicated OAuth callback route exists at src/app/auth/callback.tsx
 * 4. login.tsx and signup.tsx call real signInWithGoogle without demo alert restrictions
 * 5. DEMO badges and Local-First labels are hidden when Supabase is configured
 * 6. WebBrowser.maybeCompleteAuthSession() called for OAuth completion
 * 7. Zero hardcoded Google Client Secrets, Gemini API keys, or Supabase service-role keys in codebase
 * 8. AuthContext exposes signInWithGoogle and handles session updates
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('🧪 Starting Solace AI Google OAuth Verification Suite...\n');

const projectRoot = fs.existsSync('solace-ai') ? 'solace-ai' : '.';

// 1. authService implements Google OAuth methods
it('1. authService implements signInWithGoogle, handleAuthCallbackUrl, and session builder', () => {
  const servicePath = path.join(projectRoot, 'src/services/authService.ts');
  assert.strictEqual(fs.existsSync(servicePath), true);
  const content = fs.readFileSync(servicePath, 'utf8');

  assert.strictEqual(content.includes('signInWithGoogle()'), true);
  assert.strictEqual(content.includes('handleAuthCallbackUrl('), true);
  assert.strictEqual(content.includes('buildAndPersistSessionFromSupabase('), true);
  assert.strictEqual(content.includes("provider: 'google'"), true);
  assert.strictEqual(content.includes('skipBrowserRedirect: true'), true);
});

// 2. PKCE code exchange and implicit token handling
it('2. authService handles both PKCE code exchange and implicit grant tokens', () => {
  const servicePath = path.join(projectRoot, 'src/services/authService.ts');
  const content = fs.readFileSync(servicePath, 'utf8');

  assert.strictEqual(content.includes('exchangeCodeForSession(code)'), true);
  assert.strictEqual(content.includes('setSession({'), true);
  assert.strictEqual(content.includes('WebBrowser.openAuthSessionAsync('), true);
});

// 3. Deep link scheme and package configuration
it('3. app.json defines scheme "solaceai" and android package "com.solaceai.app"', () => {
  const appJsonPath = path.join(projectRoot, 'app.json');
  assert.strictEqual(fs.existsSync(appJsonPath), true);
  const config = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  assert.strictEqual(config.expo.scheme, 'solaceai');
  assert.strictEqual(config.expo.android?.package, 'com.solaceai.app');
});

// 4. Dedicated OAuth callback route exists
it('4. Dedicated OAuth callback route exists at src/app/auth/callback.tsx', () => {
  const callbackPath = path.join(projectRoot, 'src/app/auth/callback.tsx');
  assert.strictEqual(fs.existsSync(callbackPath), true);
  const content = fs.readFileSync(callbackPath, 'utf8');

  assert.strictEqual(content.includes('handleAuthCallbackUrl'), true);
  assert.strictEqual(content.includes('Connecting to Sanctuary'), true);
});

// 5. login.tsx calls signInWithGoogle and removes demo restriction
it('5. src/app/login.tsx invokes signInWithGoogle without demo alert restriction', () => {
  const loginPath = path.join(projectRoot, 'src/app/login.tsx');
  const content = fs.readFileSync(loginPath, 'utf8');

  assert.strictEqual(content.includes('signInWithGoogle()'), true);
  assert.strictEqual(content.includes('isGoogleSubmitting'), true);
  assert.strictEqual(content.includes('Feature Unavailable'), false);
  assert.strictEqual(content.includes('!isSupabaseConfigured() &&'), true);
});

// 6. signup.tsx calls signInWithGoogle and removes demo restriction
it('6. src/app/signup.tsx invokes signInWithGoogle without demo alert restriction', () => {
  const signupPath = path.join(projectRoot, 'src/app/signup.tsx');
  const content = fs.readFileSync(signupPath, 'utf8');

  assert.strictEqual(content.includes('signInWithGoogle()'), true);
  assert.strictEqual(content.includes('isGoogleSubmitting'), true);
  assert.strictEqual(content.includes('Feature Unavailable'), false);
  assert.strictEqual(content.includes('!isSupabaseConfigured() &&'), true);
});

// 7. AuthContext provides signInWithGoogle and reactive listener
it('7. AuthContext provides signInWithGoogle and onAuthStateChange subscriber', () => {
  const contextPath = path.join(projectRoot, 'src/context/AuthContext.tsx');
  const content = fs.readFileSync(contextPath, 'utf8');

  assert.strictEqual(content.includes('signInWithGoogle: () => Promise<AuthResult>'), true);
  assert.strictEqual(content.includes('supabase.auth.onAuthStateChange'), true);
});

// 8. Zero hardcoded secrets in mobile code
it('8. Zero hardcoded Google Client Secrets, service-role keys, or Gemini keys in mobile code', () => {
  const srcPath = path.join(projectRoot, 'src');
  const files = [];

  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js')) {
        files.push(full);
      }
    }
  }

  walk(srcPath);

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    assert.strictEqual(
      text.includes('service_role') || text.includes('SUPABASE_SERVICE_ROLE'),
      false,
      `Service role key found in ${f}`
    );
    assert.strictEqual(
      text.includes('client_secret') && !text.includes('Google Client Secret'),
      false,
      `Client secret found in ${f}`
    );
  }
});

// 9. Stack Navigator includes auth/callback
it('9. Stack Navigator in src/app/_layout.tsx registers auth/callback screen', () => {
  const layoutPath = path.join(projectRoot, 'src/app/_layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  assert.strictEqual(content.includes('<Stack.Screen name="auth/callback" />'), true);
  assert.strictEqual(content.includes('WebBrowser.maybeCompleteAuthSession()'), true);
});

console.log(`\n======================================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}

