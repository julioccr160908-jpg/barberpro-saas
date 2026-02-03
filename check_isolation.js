
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verify() {
    console.log("--- Verifying Data Isolation ---");

    // 1. Get Dono 1 and Dono 2 IDs
    const { data: dono1 } = await supabase.from('profiles').select('id, organization_id').eq('email', 'dono1@gmail.com').single();
    const { data: dono2 } = await supabase.from('profiles').select('id, organization_id').eq('email', 'dono2@gmail.com').single();

    if (!dono1 || !dono2) {
        console.error("Could not find test users.");
        return;
    }

    console.log(`Dono 1 Org: ${dono1.organization_id}`);
    console.log(`Dono 2 Org: ${dono2.organization_id}`);

    if (dono1.organization_id === dono2.organization_id) {
        console.error("❌ FAILURE: Dono 1 and Dono 2 share the same Org ID!");
    } else {
        console.log("✅ CHECK: Org IDs are different.");
    }

    // 2. Count appointments for each org to ensure they don't see each other's (simulated by querying by org_id)
    const { count: count1 } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('organization_id', dono1.organization_id);
    const { count: count2 } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('organization_id', dono2.organization_id);

    console.log(`Dono 1 Appointments: ${count1}`);
    console.log(`Dono 2 Appointments: ${count2}`);

    console.log("--- Done ---");
}

verify();
