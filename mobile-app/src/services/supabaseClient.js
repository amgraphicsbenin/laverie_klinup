import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucnqwqkjnlsrbdbmukvz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo';

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
