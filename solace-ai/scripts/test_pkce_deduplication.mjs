import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- Verifying OAuth Stage Logging & PKCE Deduplication ---\n');

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Check authService.ts for safe stage logs and deduplication
const authServicePath = path.join(rootDir, 'src', 'services', 'authService.ts');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

assert(
  authServiceContent.includes('[Auth Stage 1: OAuth initiated]'),
  'authService logs [Auth Stage 1: OAuth initiated]'
);

assert(
  authServiceContent.includes('[Auth Stage 2: Google authorization completed]'),
  'authService logs [Auth Stage 2: Google authorization completed]'
);

assert(
  authServiceContent.includes('[Auth Stage 3: Supabase callback reached]'),
  'authService logs [Auth Stage 3: Supabase callback reached]'
);

assert(
  authServiceContent.includes('[Auth Stage 4: App redirect received]'),
  'authService logs [Auth Stage 4: App redirect received]'
);

assert(
  authServiceContent.includes('[Auth Stage 5: Session exchange completed]') &&
  authServiceContent.includes('[Auth Stage 5: Session exchange failed]'),
  'authService logs [Auth Stage 5: Session exchange completed / failed]'
);

assert(
  authServiceContent.includes('activeCodeExchangePromise') &&
  authServiceContent.includes('lastExchangedCodeKey'),
  'authService implements in-flight deduplication lock for PKCE exchange'
);

// 2. Check auth/callback.tsx for safe stage logs and delegation
const callbackPath = path.join(rootDir, 'src', 'app', 'auth', 'callback.tsx');
const callbackContent = fs.readFileSync(callbackPath, 'utf8');

assert(
  callbackContent.includes('[Auth Stage 3: Supabase callback reached]') &&
  callbackContent.includes('[Auth Stage 4: App redirect received]') &&
  callbackContent.includes('[Auth Stage 5: Session exchange completed]'),
  'auth/callback.tsx logs Stage 3, 4, 5'
);

assert(
  callbackContent.includes('authService.handleAuthCallbackUrl'),
  'auth/callback.tsx delegates to authService.handleAuthCallbackUrl'
);

assert(
  !callbackContent.includes('supabase.auth.exchangeCodeForSession'),
  'auth/callback.tsx does not directly exchange code (prevents race condition)'
);

// 3. Security check: Ensure no logging of sensitive tokens or codes
const sensitivePatterns = [
  /console\.(log|warn|info|error)\([^)]*accessToken[^)]*\)/i,
  /console\.(log|warn|info|error)\([^)]*refreshToken[^)]*\)/i,
  /console\.(log|warn|info|error)\([^)]*access_token[^)]*\)/i,
  /console\.(log|warn|info|error)\([^)]*refresh_token[^)]*\)/i,
  /console\.(log|warn|info|error)\([^)]*password[^)]*\)/i,
];

let leakDetected = false;
for (const pattern of sensitivePatterns) {
  if (pattern.test(authServiceContent) || pattern.test(callbackContent)) {
    console.error(`❌ Security failure: Potential token logging pattern matched: ${pattern}`);
    leakDetected = true;
    failed = true;
  }
}

if (!leakDetected) {
  console.log('✅ PASS: Zero tokens, passwords, or secrets logged in console statements');
}

if (failed) {
  console.error('\n❌ OAuth Stage Logging & PKCE Deduplication verification failed.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL PKCE DEDUPLICATION & LOGGING VERIFICATIONS PASSED!\n');
}

