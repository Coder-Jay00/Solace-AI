/**
 * Solace AI - Local Environment Validation Script
 * Phase 8: Supabase Cloud Backend Integration
 *
 * Validates presence and structure of environment variables WITHOUT printing
 * any secret values or sensitive URLs to output.
 */

import fs from 'fs';
import path from 'path';

export function checkEnvConfig(envPath = 'solace-ai/.env') {
  const target = fs.existsSync(envPath) ? envPath : (fs.existsSync('.env') ? '.env' : null);
  if (!target) {
    return {
      fileExists: false,
      hasValidUrl: false,
      hasValidAnonKey: false,
      isConfigured: false,
    };
  }

  const content = fs.readFileSync(target, 'utf8');
  const lines = content.split('\n');

  let hasValidUrl = false;
  let hasValidAnonKey = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const val = match[2].trim().replace(/^['"](.*)['"]$/, '$1');

    if (key === 'EXPO_PUBLIC_SUPABASE_URL') {
      // Must start with https:// and contain .supabase.co or valid host
      if (val.length > 10 && (val.startsWith('https://') || val.startsWith('http://'))) {
        hasValidUrl = true;
      }
    } else if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
      // Anon key is typically a long JWT or publishable token (> 20 chars)
      if (val.length > 20 && !val.includes('your-anon-key')) {
        hasValidAnonKey = true;
      }
    }
  }

  return {
    fileExists: true,
    hasValidUrl,
    hasValidAnonKey,
    isConfigured: hasValidUrl && hasValidAnonKey,
  };
}

if (process.argv[1]?.endsWith('validate_env.mjs')) {
  const result = checkEnvConfig();
  console.log('Environment configuration status:');
  console.log(`  .env file present: ${result.fileExists ? 'YES' : 'NO'}`);
  console.log(`  Supabase URL configured: ${result.hasValidUrl ? 'YES' : 'NO'}`);
  console.log(`  Supabase Anon Key configured: ${result.hasValidAnonKey ? 'YES' : 'NO'}`);
  console.log(`  Ready for Supabase initialization: ${result.isConfigured ? 'YES' : 'PENDING CREDENTIALS'}`);
}

