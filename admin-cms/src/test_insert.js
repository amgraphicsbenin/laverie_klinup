import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucnqwqkjnlsrbdbmukvz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const testStaffWithStore = {
    id: 'u_test_store',
    nom: 'Test',
    prenom: 'User',
    role: 'agent_accueil',
    email: 'test.store@klinup.com',
    code_pin: '000000',
    statut: 'actif',
    store_id: 'store_central'
  };

  console.log("Attempting insert WITH store_id...");
  const res1 = await supabase.from('staff').insert(testStaffWithStore);
  console.log("Result WITH store_id:", res1.error ? res1.error.message : "SUCCESS!");

  const testStaffSanitized = {
    id: 'u_test_clean',
    nom: 'Test',
    prenom: 'Clean',
    role: 'agent_accueil',
    email: 'test.clean@klinup.com',
    code_pin: '000000',
    statut: 'actif'
  };

  console.log("\nAttempting insert WITHOUT store_id...");
  const res2 = await supabase.from('staff').insert(testStaffSanitized);
  console.log("Result WITHOUT store_id:", res2.error ? res2.error.message : "SUCCESS!");

  // Clean up
  await supabase.from('staff').delete().eq('id', 'u_test_clean');
}

run();
