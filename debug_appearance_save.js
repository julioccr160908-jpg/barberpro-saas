
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUpdate() {
    console.log("Debugging Appearance Update...");

    // 1. Get Org ID for barbearia-1
    const { data: org, error: orgError } = await supabase.from('organizations').select('id, name').eq('slug', 'barbearia-1').single();

    if (orgError) {
        console.error("Org Fetch Error:", orgError);
        return;
    }
    console.log("Target Org:", org);

    // 2. Attempt Update
    const updatePayload = {
        primary_color: '#00FF00', // Test color (Green)
        secondary_color: '#FF0000',
        theme_mode: 'light'
    };

    console.log("Attempting update with:", updatePayload);

    const { data, error } = await supabase
        .from('organizations')
        .update(updatePayload)
        .eq('id', org.id)
        .select();

    if (error) {
        console.error("Update FAILED:", error);
    } else {
        console.log("Update SUCCESS:", data);
    }
}

debugUpdate();
