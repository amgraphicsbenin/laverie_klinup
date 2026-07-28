import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucnqwqkjnlsrbdbmukvz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Querying Supabase 'staff' table...");
  const { data, error } = await supabase.from('staff').select('*');
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log(`Found ${data ? data.length : 0} staff records in Supabase:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
