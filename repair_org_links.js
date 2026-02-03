
import { createClient } from '@supabase/supabase-js';

// Config
const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function repair() {
    console.log("--- Repairing Org Links ---");

    const mappings = [
        { email: 'dono1@gmail.com', orgSlug: 'barbearia-dono1' },
        { email: 'dono2@gmail.com', orgSlug: 'barbearia-dono-2' }
    ];

    for (const map of mappings) {
        console.log(`Processing ${map.email}...`);

        // 1. Get User
        const { data: user, error: userError } = await supabase.from('profiles').select('id').eq('email', map.email).single();

        if (userError || !user) {
            console.error(`User ${map.email} not found!`, userError);
            continue;
        }

        // 2. Get Org
        const { data: org, error: orgError } = await supabase.from('organizations').select('id').eq('slug', map.orgSlug).single();

        if (orgError || !org) {
            console.error(`Org ${map.orgSlug} not found!`, orgError);
            // Try fuzzy search?
            continue;
        }

        // 3. Link
        const { error: updateError } = await supabase.from('profiles').update({ organization_id: org.id }).eq('id', user.id);

        if (updateError) {
            console.error(`Failed to link ${map.email} to org ${org.id}`, updateError);
        } else {
            console.log(`✅ Success: Linked ${map.email} to ${map.orgSlug} (${org.id})`);
        }
    }
}

repair();
