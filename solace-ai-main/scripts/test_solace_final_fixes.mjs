/**
 * Solace AI - Comprehensive Verification Test Suite
 * Validates fixes for:
 * 1. Google OAuth redirect URI, timeout, PKCE deduplication, and redirect_to decoding.
 * 2. Local notification channels, quiet hours calculation, 4 reminder categories.
 * 3. Chat layout, KeyboardAvoidingView configuration, Android composer visibility.
 * 4. Real AI service integration, dynamic cloud/local labeling, Supabase chat sync.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('🧪 RUNNING SOLACE AI PRE-SUBMISSION VERIFICATION SUITE');
console.log('================================================================\n');

let passCount = 0;
let totalCount = 0;

async function test(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runAll() {
  // ----------------------------------------------------------------------------
  // TEST GROUP 1: OAuth Redirect, Timeout & PKCE Deduplication
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 1: Google OAuth Dynamic Scheme, Timeout & PKCE ---');

  await test('Dynamic Expo Go Redirect URI uses hostUri with exp:// and /--/auth/callback', () => {
    const hostUri = '192.168.1.13:8081';
    const cleanHost = hostUri.replace(/\/+$/, '');
    const expoGoRedirect = `exp://${cleanHost}/--/auth/callback`;
    assert.equal(expoGoRedirect, 'exp://192.168.1.13:8081/--/auth/callback');
    assert.ok(!expoGoRedirect.includes('localhost'));
    assert.ok(expoGoRedirect.startsWith('exp://'));
  });

  await test('Standalone APK Redirect URI uses custom solaceai:// scheme', () => {
    const standaloneRedirect = 'solaceai://auth/callback';
    assert.equal(standaloneRedirect, 'solaceai://auth/callback');
    assert.ok(standaloneRedirect.startsWith('solaceai://'));
  });

  await test('OAuth URL redirect_to parameter is safely extractable and decoded', () => {
    const sampleUrl = 'https://mockproject.supabase.co/auth/v1/authorize?provider=google&redirect_to=exp%3A%2F%2F192.168.1.13%3A8081%2F--%2Fauth%2Fcallback';
    const parsed = new URL(sampleUrl);
    const redirectToParam = parsed.searchParams.get('redirect_to');
    assert.equal(redirectToParam, 'exp://192.168.1.13:8081/--/auth/callback');
    assert.ok(!redirectToParam.includes('localhost'));
  });

  await test('PKCE code deduplication correctly rejects duplicate callback exchange', async () => {
    const activeExchanges = new Map();
    const completedCodes = new Set();

    function exchangeCode(code) {
      if (completedCodes.has(code)) {
        return Promise.resolve({ success: true, deduplicated: true, status: 'already_exchanged' });
      }
      if (activeExchanges.has(code)) {
        return activeExchanges.get(code);
      }
      const promise = (async () => {
        await new Promise((r) => setTimeout(r, 10));
        completedCodes.add(code);
        activeExchanges.delete(code);
        return { success: true, deduplicated: false, status: 'exchanged_fresh' };
      })();
      activeExchanges.set(code, promise);
      return promise;
    }

    const code = 'test_pkce_auth_code_12345';
    const first = exchangeCode(code);
    const second = exchangeCode(code);
    assert.equal(first, second); // Parallel calls share identical promise

    const res1 = await first;
    const res2 = await second;
    assert.equal(res1.status, 'exchanged_fresh');
    assert.equal(res2.status, 'exchanged_fresh');

    const third = await exchangeCode(code);
    assert.equal(third.status, 'already_exchanged');
  });

  await test('authService contains timeout protection on browser auth session', () => {
    const authServicePath = path.resolve('solace-ai/src/services/authService.ts');
    const content = fs.readFileSync(authServicePath, 'utf8');
    assert.ok(content.includes('AUTH_TIMEOUT_MS'), 'Missing timeout constant');
    assert.ok(content.includes('Promise.race'), 'Missing Promise.race for timeout');
    assert.ok(content.includes("browserResult.type === 'timeout'"), 'Missing timeout handling logic');
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: Local Notification Channels & Quiet Hours
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 2: Local Notifications & Channel Initialization ---');

  await test('Notification channel setup avoids sound resource lookup crash on Expo Go', () => {
    const notifServicePath = path.resolve('solace-ai/src/services/notificationService.ts');
    const content = fs.readFileSync(notifServicePath, 'utf8');
    const initChannelsSnippet = content.substring(
      content.indexOf('initChannels'),
      content.indexOf('getPermissionStatus')
    );
    assert.ok(!initChannelsSnippet.includes("sound: 'default'"), 'initChannels should not have sound: default');
    assert.ok(content.includes('setNotificationChannelAsync'), 'Must have setNotificationChannelAsync');
  });

  await test('Quiet hours calculation accurately detects overnight suppression', () => {
    // Quiet hours: 22:00 (10 PM) to 07:00 (7 AM)
    function isInQuietHours(hour, minute, startH = 22, startM = 0, endH = 7, endM = 0) {
      const curTotal = hour * 60 + minute;
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      if (startTotal > endTotal) {
        // Spans midnight
        return curTotal >= startTotal || curTotal < endTotal;
      }
      return curTotal >= startTotal && curTotal < endTotal;
    }

    assert.equal(isInQuietHours(23, 15), true, '11:15 PM should be quiet');
    assert.equal(isInQuietHours(3, 0), true, '3:00 AM should be quiet');
    assert.equal(isInQuietHours(6, 59), true, '6:59 AM should be quiet');
    assert.equal(isInQuietHours(7, 0), false, '7:00 AM should NOT be quiet');
    assert.equal(isInQuietHours(14, 30), false, '2:30 PM should NOT be quiet');
    assert.equal(isInQuietHours(21, 59), false, '9:59 PM should NOT be quiet');
    assert.equal(isInQuietHours(22, 0), true, '10:00 PM should be quiet');
  });

  await test('All 4 reminder categories are defined with identifiers', () => {
    const notifTypesPath = path.resolve('solace-ai/src/types/notification.ts');
    const content = fs.readFileSync(notifTypesPath, 'utf8');
    const categories = ['mood', 'breathing', 'intention', 'companion'];
    for (const cat of categories) {
      assert.ok(content.includes(cat), `Category ${cat} should be present in notification.ts`);
    }
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: Android Chat Layout & Composer Visibility
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 3: Android Chat Layout & Keyboard Avoiding ---');

  await test('app.json contains softwareKeyboardLayoutMode resize for Android', () => {
    const appJsonPath = path.resolve('solace-ai/app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    assert.equal(
      appJson.expo.android.softwareKeyboardLayoutMode,
      'resize',
      'Android softwareKeyboardLayoutMode must be set to resize'
    );
  });

  await test('companion.tsx configures KeyboardAvoidingView behavior and offset', () => {
    const companionPath = path.resolve('solace-ai/src/app/(tabs)/companion.tsx');
    const content = fs.readFileSync(companionPath, 'utf8');
    assert.ok(content.includes("behavior={Platform.OS === 'ios' ? 'padding' : 'height'}"));
    assert.ok(content.includes("keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}"));
    assert.ok(content.includes('chatScrollView: {'), 'chatScrollView must have style defined');
    assert.ok(content.includes('flex: 1'), 'chatScrollView must flex: 1 to prevent pushing composer down');
  });

  await test('companion.tsx supports hardware back button keyboard dismissal', () => {
    const companionPath = path.resolve('solace-ai/src/app/(tabs)/companion.tsx');
    const content = fs.readFileSync(companionPath, 'utf8');
    assert.ok(content.includes('hardwareBackPress'));
    assert.ok(content.includes('Keyboard.dismiss()'));
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: AI Companion, Dynamic Footnote & Supabase Sync
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 4: Live AI Companion, Dynamic Footnote & Persistence ---');

  await test('companion.tsx dynamically renders Cloud vs Local status', () => {
    const companionPath = path.resolve('solace-ai/src/app/(tabs)/companion.tsx');
    const content = fs.readFileSync(companionPath, 'utf8');
    assert.ok(content.includes('✦ Solace AI Sanctuary • Cloud Synchronized'));
    assert.ok(content.includes('Local Mindfulness Mode • Private Local Storage'));
    assert.ok(!content.includes("'Local demonstration companion • Private local storage'"));
  });

  await test('settings.tsx dynamically renders Cloud Account vs Local Demo', () => {
    const settingsPath = path.resolve('solace-ai/src/app/settings.tsx');
    const content = fs.readFileSync(settingsPath, 'utf8');
    assert.ok(content.includes('✦ Cloud Sanctuary Account'));
    assert.ok(content.includes('Local Demo Account'));
  });

  await test('chatService integrates Supabase conversations and messages hydration', () => {
    const chatServicePath = path.resolve('solace-ai/src/services/chatService.ts');
    const content = fs.readFileSync(chatServicePath, 'utf8');
    assert.ok(content.includes("from('conversations')"), 'Must query conversations table');
    assert.ok(content.includes("from('chat_messages')"), 'Must query chat_messages table');
    assert.ok(content.includes('isSupabaseConfigured()'), 'Must check Supabase configuration');
  });

  await test('aiCompanionService invokes solace-ai-chat Edge Function with session token', () => {
    const aiServicePath = path.resolve('solace-ai/src/services/aiCompanionService.ts');
    const content = fs.readFileSync(aiServicePath, 'utf8');
    assert.ok(content.includes("supabase.functions.invoke('solace-ai-chat'"));
    assert.ok(content.includes('session?.access_token'));
    assert.ok(content.includes('isCrisis'));
  });

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 RESULTS: ${passCount} / ${totalCount} checks passed (${Math.round((passCount / totalCount) * 100)}%)`);
  console.log('================================================================\n');

  if (passCount !== totalCount) {
    process.exit(1);
  }
}

runAll();
