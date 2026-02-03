
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3RzdHJhcCIsInJvbGUiOiJpbnNlcnRfYW5vbl9rZXkiLCJpYXQiOjE2MTY1NTM1ODgsImV4cCI6NDc3MjE1MzU4OH0.QrN_-kZX7_wS_wh-p9p1_ev5_2S-W5_2S-W5_2S-W5';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateColor() {
    const email = 'dono1@gmail.com';
    const password = '123456';
    const orgId = 'bb9c6bf5-73ee-4ff9-9bd2-a75f5460d912';
    const newColor = '#3b82f6'; // Blue

    console.log(`\n🔐 Authenticating as ${email}...`);
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
        console.error('❌ Auth Failed:', authErr);
        return;
    }
    console.log('✅ Auth Success');

    console.log(`\n🎨 Updating Primary Color for Org: ${orgId}`);

    // 1. Update (RLS should allow Owner to update their settings)
    const { error: updateError } = await supabase
        .from('settings')
        .update({ primary_color: newColor })
        .eq('organization_id', orgId);

    if (updateError) {
        console.error('❌ Update Failed:', updateError);
        return;
    }
    console.log('✅ Update Executed');

    // 2. Verify
    const { data: settings, error: fetchError } = await supabase
        .from('settings')
        .select('primary_color')
        .eq('organization_id', orgId)
        .single();

    if (fetchError) {
        console.error('❌ Fetch Failed:', fetchError);
        return;
    }

    console.log(`\n🔍 Verification Result:`);
    console.log(`   Primary Color: ${settings.primary_color}`);

    if (settings.primary_color === newColor) {
        console.log('✅ SUCCESS: Color is now Blue/Purple.');
    } else {
        console.log('⚠️ MISMATCH: Color did not update correctly.');
    }
}

updateColor();
