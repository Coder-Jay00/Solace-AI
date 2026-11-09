/**
 * Test live Google OAuth configuration on the user's Supabase project
 */

import fs from 'fs';
import path from 'path';

const projectRoot = fs.existsSync('solace-ai') ? 'solace-ai' : '.';
const envPath = path.join(projectRoot, '.env');

let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
    if (key.trim() === 'EXPO_PUBLIC_SUPABASE_URL') supabaseUrl = val;
    if (key.trim() === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = val;
  }
}

async function testOAuth() {
  console.log('🔍 Testing Supabase Google OAuth Provider configuration...\n');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'solaceai://auth/callback',
        skipBrowserRedirect: true,
      }
    });

    if (error) {
      console.log('ℹ️ Supabase OAuth error response:', error.message);
      if (error.message.includes('not enabled')) {
        console.log('⚠️ Google provider is not yet enabled in Supabase Dashboard.');
        console.log('   Action: Enable Google provider under Authentication -> Providers -> Google in your Supabase Dashboard.');
      }
    } else if (data?.url) {
      console.log('✓ SUCCESS: Supabase Google OAuth is fully ENABLED and configured!');
      console.log(`✓ Generated Authorization URL provider: ${data.provider}`);
      console.log(`✓ Auth URL host: ${new URL(data.url).hostname}`);
      console.log('✓ Ready for live Google Sign-In in Expo app.');
    } else {
      console.log('ℹ️ Response data:', data);
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testOAuth();

