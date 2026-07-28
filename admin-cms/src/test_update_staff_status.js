import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucnqwqkjnlsrbdbmukvz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdateStatus() {
  // 1. Create a dummy staff member
  const newStaff = {
    id: 'u_status_test',
    nom: 'StatusTest',
    prenom: 'User',
    role: 'agent_accueil',
    email: 'status.test@klinup.com',
    code_pin: '000000',
    statut: 'actif'
  };

  console.log("Creating test user...");
  await supabase.from('staff').insert(newStaff);

  console.log("\nUpdating statut to 'suspendu'...");
  const updateRes = await supabase.from('staff').update({ statut: 'suspendu' }).eq('id', newStaff.id);
  console.log("Update result error:", updateRes.error ? updateRes.error : "NONE");

  console.log("\nFetching updated staff from Supabase...");
  const { data } = await supabase.from('staff').select('*').eq('id', newStaff.id);
  console.log("Fetched data:", data);

  console.log("\nCleaning up...");
  await supabase.from('staff').delete().eq('id', newStaff.id);
}

testUpdateStatus();
