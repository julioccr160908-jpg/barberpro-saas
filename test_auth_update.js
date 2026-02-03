
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthUpdate() {
    console.log("Testing Update AS USER (dono1@gmail.com)...");

    // 1. Sign In
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'dono1@gmail.com',
        password: '123456' // Assuming this is the password
    });

    if (loginError) {
        console.error("Login Failed:", loginError);
        return;
    }
    console.log("Logged in as:", session.user.id);

    // 2. Get Org ID (Authenticated)
    const { data: org, error: orgError } = await supabase.from('organizations').select('id, name').eq('slug', 'barbearia-1').single();
    if (orgError) {
        console.error("Org Find Error:", orgError);
        return;
    }
    console.log("Target Org:", org);

    // 3. Attempt Update
    const { error: updateError } = await supabase
        .from('organizations')
        .update({ primary_color: '#FFFF00' }) // Yellow
        .eq('id', org.id);

    if (updateError) {
        console.error("Update FAILED:", updateError);
    } else {
        console.log("Update SUCCESS!");
    }
}

testAuthUpdate();
