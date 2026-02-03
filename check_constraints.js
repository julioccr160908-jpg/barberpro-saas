
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkConstraints() {
    console.log("--- Checking Constraints for settings table ---");

    // Query to find constraints on settings table
    // This is a bit complex via Supabase JS client on standard tables, usually easier via SQL.
    // But I can try to insert a duplicate and see the error? 
    // Or just try to read metadata if possible. 
    // Actually, I'll try to insert a dummy record for a non-existent org or use SQL if possible.
    // Since I don't have direct SQL access easily without the specific endpoint or pg driver, 
    // I'll try to use the rpc 'exec_sql' if it exists (some setups have it).
    // No, I'll just try to upsert as a test user and see the detailed error.

    const testOrgId = '00000000-0000-0000-0000-000000000000'; // Invalid UUID but valid format

    // Try to upsert
    const { error } = await supabase.from('settings').upsert({
        organization_id: testOrgId,
        establishment_name: 'Test'
    }, { onConflict: 'organization_id' });

    if (error) {
        console.log("Upsert Error:", error);
        if (error.message.includes('there is no unique or exclusion constraint matching the ON CONFLICT specification')) {
            console.error("❌ ROOT CAUSE: Missing Unique Constraint on organization_id in settings table!");
        }
    } else {
        console.log("✅ Upsert worked significantly - constraint likely exists (or it was a clean insert).");
        // Clean up
        await supabase.from('settings').delete().eq('organization_id', testOrgId);
    }
}

checkConstraints();
