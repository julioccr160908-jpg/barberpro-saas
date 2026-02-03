
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log("Searching for 'barber1'...");

    // Check Profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', '%barber1%');

    if (error) {
        console.error("Error searching profiles:", error);
    } else {
        if (profiles.length === 0) {
            console.log("No profile found with 'barber1' in email.");
        } else {
            console.log("Found Profiles:", profiles);

            // Check Org Context
            const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', profiles.map(p => p.organization_id));
            console.log("Linked Organizations:", orgs);
        }
    }
}

checkUser();
