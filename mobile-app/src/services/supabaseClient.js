import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const appEnv = (process.env.APP_ENV || process.env.EXPO_PUBLIC_APP_ENV || 'production').toLowerCase();

const defaultUrls = {
  test: 'https://ryjwrjzggfwglfmyovhk.supabase.co',
  staging: 'https://ryjwrjzggfwglfmyovhk.supabase.co',
  production: 'https://ucnqwqkjnlsrbdbmukvz.supabase.co',
};

const defaultAnonKeys = {
  test: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andyanpnZ2Z3Z2xmbXlvdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDE4NDcsImV4cCI6MjEwNTExNzg0N30.SuL0HAWzX2EmISFgf01wt5huArlRw5Dcd4fayMpVt8c',
  staging: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andyanpnZ2Z3Z2xmbXlvdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDE4NDcsImV4cCI6MjEwNTExNzg0N30.SuL0HAWzX2EmISFgf01wt5huArlRw5Dcd4fayMpVt8c',
  production: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo',
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || defaultUrls[appEnv] || defaultUrls.production;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKeys[appEnv] || defaultAnonKeys.production;

const nativeFetch = globalThis.fetch.bind(globalThis);

async function supabaseFetch(...args) {
  try {
    return await nativeFetch(...args);
  } catch (error) {
    return new Response(JSON.stringify({
      message: error instanceof Error ? error.message : 'Network request failed',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
  },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
