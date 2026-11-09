/**
 * Probe solace-ai-chat Edge Function HTTP endpoint
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

async function probe() {
  const functionUrl = `${supabaseUrl}/functions/v1/solace-ai-chat`;
  console.log('Probing endpoint:', functionUrl.replace(/\/\/[^.]+\./, '//[PROJECT_ID].'));

  try {
    // 1. Test OPTIONS (CORS preflight)
    const optionsRes = await fetch(functionUrl, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseAnonKey,
      }
    });
    console.log('OPTIONS status:', optionsRes.status, optionsRes.statusText);

    // 2. Test POST without auth
    const postRes = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Ping' })
    });
    console.log('POST (unauth) status:', postRes.status, postRes.statusText);
    const postBody = await postRes.text();
    console.log('POST response preview:', postBody);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

probe();

