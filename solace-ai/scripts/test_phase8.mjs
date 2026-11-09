/**
 * Solace AI - Phase 8 Supabase Cloud Backend Verification Suite
 *
 * Verifies:
 * 1. Environment configuration files and security rules (.env.example, .gitignore)
 * 2. Database schema integrity, tables, foreign keys, indexes, triggers, and RLS policies
 * 3. Supabase client safe initialization and zero service-role key usage
 * 4. Backward-compatible authentication fallback
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

console.log('🧪 Starting Solace AI Phase 8 Supabase Backend Verification Suite...\n');

const projectRoot = fs.existsSync('solace-ai') ? 'solace-ai' : '.';

// 1. Environment and credential security
it('1. .env.example exists with exact required keys', () => {
  const examplePath = path.join(projectRoot, '.env.example');
  assert.strictEqual(fs.existsSync(examplePath), true, '.env.example must exist');
  const content = fs.readFileSync(examplePath, 'utf8');
  assert.strictEqual(content.includes('EXPO_PUBLIC_SUPABASE_URL='), true);
  assert.strictEqual(content.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY='), true);
});

it('2. .gitignore strictly excludes .env from version control', () => {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  assert.strictEqual(fs.existsSync(gitignorePath), true, '.gitignore must exist');
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map((l) => l.trim());
  assert.strictEqual(lines.includes('.env'), true, '.env must be explicitly in .gitignore');
  assert.strictEqual(lines.includes('.env*.local'), true, '.env*.local must be in .gitignore');
});

it('3. Zero service-role or secret keys exist in client codebase', () => {
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
      `Service role key referenced in client file: ${f}`
    );
  }
});

// 2. Database Schema Verification
it('4. supabase/schema.sql exists and creates all 6 required tables', () => {
  const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
  assert.strictEqual(fs.existsSync(schemaPath), true, 'supabase/schema.sql must exist');
  const sql = fs.readFileSync(schemaPath, 'utf8').toLowerCase();

  assert.strictEqual(sql.includes('create table if not exists public.profiles'), true);
  assert.strictEqual(sql.includes('create table if not exists public.mood_entries'), true);
  assert.strictEqual(sql.includes('create table if not exists public.breathing_sessions'), true);
  assert.strictEqual(sql.includes('create table if not exists public.conversations'), true);
  assert.strictEqual(sql.includes('create table if not exists public.chat_messages'), true);
  assert.strictEqual(sql.includes('create table if not exists public.user_preferences'), true);
});

it('5. supabase/schema.sql enforces auth.users foreign keys and cascading deletes', () => {
  const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8').toLowerCase();

  assert.strictEqual(sql.includes('references auth.users(id) on delete cascade'), true);
  assert.strictEqual(sql.includes('references public.conversations(id) on delete cascade'), true);
});

it('6. supabase/schema.sql defines performance indexes on foreign keys', () => {
  const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8').toLowerCase();

  assert.strictEqual(sql.includes('idx_profiles_id'), true);
  assert.strictEqual(sql.includes('idx_mood_entries_user_date'), true);
  assert.strictEqual(sql.includes('idx_breathing_sessions_user_date'), true);
  assert.strictEqual(sql.includes('idx_conversations_user_updated'), true);
  assert.strictEqual(sql.includes('idx_chat_messages_conv_date'), true);
  assert.strictEqual(sql.includes('idx_user_preferences_user'), true);
});

it('7. supabase/schema.sql configures automatic user initialization trigger', () => {
  const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8').toLowerCase();

  assert.strictEqual(sql.includes('handle_new_user()'), true);
  assert.strictEqual(sql.includes('on_auth_user_created'), true);
  assert.strictEqual(sql.includes('after insert on auth.users'), true);
});

it('8. supabase/schema.sql enables Row-Level Security on all tables', () => {
  const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8').toLowerCase();

  assert.strictEqual(sql.includes('alter table public.profiles enable row level security;'), true);
  assert.strictEqual(sql.includes('alter table public.mood_entries enable row level security;'), true);
  assert.strictEqual(sql.includes('alter table public.breathing_sessions enable row level security;'), true);
  assert.strictEqual(sql.includes('alter table public.conversations enable row level security;'), true);
  assert.strictEqual(sql.includes('alter table public.chat_messages enable row level security;'), true);
  assert.strictEqual(sql.includes('alter table public.user_preferences enable row level security;'), true);
});

it('9. supabase/schema.sql defines granular user isolation policies (auth.uid() = user_id)', () => {
  const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8').toLowerCase();

  assert.strictEqual(sql.includes('auth.uid() = id'), true);
  assert.strictEqual(sql.includes('auth.uid() = user_id'), true);
  assert.strictEqual(sql.includes('for select'), true);
  assert.strictEqual(sql.includes('for insert'), true);
  assert.strictEqual(sql.includes('for update'), true);
  assert.strictEqual(sql.includes('for delete'), true);
});

// 3. Client and Sync Services
it('10. supabaseClient.ts exports client and isSupabaseConfigured() safely', () => {
  const clientPath = path.join(projectRoot, 'src/services/supabaseClient.ts');
  assert.strictEqual(fs.existsSync(clientPath), true);
  const code = fs.readFileSync(clientPath, 'utf8');
  assert.strictEqual(code.includes('isSupabaseConfigured'), true);
  assert.strictEqual(code.includes('createClient'), true);
  assert.strictEqual(code.includes('EXPO_PUBLIC_SUPABASE_URL'), true);
  assert.strictEqual(code.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'), true);
});

it('11. authService.ts supports both Supabase Auth and local demo fallback', () => {
  const authPath = path.join(projectRoot, 'src/services/authService.ts');
  const code = fs.readFileSync(authPath, 'utf8');
  assert.strictEqual(code.includes('supabase.auth.signUp'), true);
  assert.strictEqual(code.includes('supabase.auth.signInWithPassword'), true);
  assert.strictEqual(code.includes('supabase.auth.signOut'), true);
  assert.strictEqual(code.includes('inMemoryUserRegistry'), true); // Fallback preserved!
});

it('12. supabaseSyncService.ts implements safe data synchronization helpers', () => {
  const syncPath = path.join(projectRoot, 'src/services/supabaseSyncService.ts');
  assert.strictEqual(fs.existsSync(syncPath), true);
  const code = fs.readFileSync(syncPath, 'utf8');
  assert.strictEqual(code.includes('syncMoodEntries'), true);
  assert.strictEqual(code.includes('syncBreathingSessions'), true);
  assert.strictEqual(code.includes('syncPreferences'), true);
  assert.strictEqual(code.includes('checkConnection'), true);
});

console.log('\n========================================');
console.log(`Summary: ${passed} / ${passed + failed} tests passed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}

