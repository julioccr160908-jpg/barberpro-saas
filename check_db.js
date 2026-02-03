
// Check Organization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb2tpbmctc3lzdGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ1ODU2MDAsImV4cCI6MjAyMDYxNDQwMH0.N_2Jk1b2j2Jk1b2j2Jk1b2j2Jk1b2j2Jk1b2j2Jk1b2'; // Default local key

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking for slug: barbearia-1");
    const { data: orgs, error } = await supabase.from('organizations').select('*');

    if (error) {
        console.error("Error fetching orgs:", error);
    } else {
        console.log("Found Organizations:", orgs);
        const match = orgs.find(o => o.slug === 'barbearia-1');
        if (match) {
            console.log("MATCH FOUND:", match);

            // Check Services
            const { data: services } = await supabase.from('services').select('*').eq('organization_id', match.id);
            console.log(`Services for ${match.name}:`, services?.length);

            // Check Settings
            const { data: settings } = await supabase.from('settings').select('*').eq('organization_id', match.id);
            console.log(`Settings for ${match.name}:`, settings);

        } else {
            console.log("NO MATCH for barbearia-1");
        }
    }
}

check();
