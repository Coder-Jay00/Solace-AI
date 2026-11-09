/**
 * Solace AI - Supabase Client Initialization
 * Phase 8: Supabase Cloud Backend Integration
 *
 * Configures the Supabase JavaScript client using public environment variables.
 * Never stores or requests service-role or secret keys in client-side code.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-url') &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (err) {
    console.warn('[SupabaseClient] Failed to initialize Supabase client:', err);
    clientInstance = null;
  }
}

export const supabase = clientInstance;

export function getSupabaseClient(): SupabaseClient | null {
  return clientInstance;
}

