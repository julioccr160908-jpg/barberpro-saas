
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkUser() {
    console.log("Linking barber1 to barbearia-1...");

    // 1. Get Org ID
    const { data: org, error: orgError } = await supabase.from('organizations').select('id').eq('slug', 'barbearia-1').single();
    if (orgError) {
        console.error("Org Error:", orgError);
        return;
    }

    // 2. Update Profile
    const { data, error } = await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .ilike('email', '%barber1%')
        .select();

    if (error) {
        console.error("Update failed:", error);
    } else {
        console.log("Updated Profiles:", data);
    }
}

linkUser();
