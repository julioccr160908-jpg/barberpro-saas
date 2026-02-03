import { createClient } from '@supabase/supabase-js';

// Config from URLS_SUPABASE_LOCAL.md
const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    console.log("--- Checking Profiles and Organization IDs ---");
    // Get all profiles
    const { data: profiles, error } = await supabase.from('profiles').select('id, name, email, role, organization_id');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);
    console.log(JSON.stringify(profiles, null, 2));

    // Get all organizations
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id, name, slug');
    if (orgError) {
        console.error("Error fetching organizations:", orgError);
    } else {
        console.log("\n--- Organizations ---");
        console.log(JSON.stringify(orgs, null, 2));
    }
}

check();
