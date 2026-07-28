import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucnqwqkjnlsrbdbmukvz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbnF3cWtqbmxzcmJkYm11a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzA1NzEsImV4cCI6MjA5Njg0NjU3MX0.8RdoITBg_AXDqN2DxuZlarrF_sx-ya1DCSyS-FLy0mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const newStaff = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    nom: 'TestUser',
    prenom: 'SuperAdminTest',
    role: 'agent_accueil',
    email: 'test.user.' + Date.now() + '@klinup.com',
    code_pin: '000000',
    statut: 'actif',
    store_id: 'store_central',
    permissions: {
      can_view_dashboard: true,
      can_manage_orders: true,
      can_manage_crm: true,
      can_edit_catalog: false,
      can_view_logs: false,
      can_manage_staff: false
    }
  };

  console.log("Inserting new staff to Supabase:", newStaff);
  let res = await supabase.from('staff').insert(newStaff).select();
  
  if (res.error && (res.error.code === 'PGRST204' || res.error.message.includes('schema cache'))) {
    console.log("--> Error PGRST204 caught! Retrying without store_id...");
    const retriedData = { ...newStaff };
    delete retriedData.store_id;
    res = await supabase.from('staff').insert(retriedData).select();
  }

  console.log("FINAL INSERT RESULT -> Error:", res.error ? res.error : "NONE", "| Data:", res.data);

  if (!res.error && res.data && res.data[0]) {
    console.log("\nVerifying select from Supabase...");
    const { data: selData, error: selErr } = await supabase.from('staff').select('*').eq('id', newStaff.id);
    console.log("SELECT RESULT -> Error:", selErr ? selErr : "NONE", "| Data:", selData);

    console.log("\nCleaning up test staff...");
    await supabase.from('staff').delete().eq('id', newStaff.id);
  }
}

testInsert();
