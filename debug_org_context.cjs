
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3RzdHJhcCIsInJvbGUiOiJpbnNlcnRfYW5vbl9rZXkiLCJpYXQiOjE2MTY1NTM1ODgsImV4cCI6NDc3MjE1MzU4OH0.QrN_-kZX7_wS_wh-p9p1_ev5_2S-W5_2S-W5_2S-W5';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugContext() {
    const email = 'cliente1@gmail.com';
    const password = '123456';
    const MOCK_LOCAL_STORAGE_SLUG = 'barbearia-1';

    console.log(`\n🕵️ Debugging OrganizationContext Logic for ${email}`);

    // 1. Auth
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) { console.error('Auth Failed', authErr); return; }
    const user = auth.user;
    console.log(`✅ User Logged In: ${user.id}`);

    // 2. Mock Logic Step 1 (Owner)
    const { data: ownedOrg } = await supabase.from('organizations').select('*').eq('owner_id', user.id).maybeSingle();
    console.log('Step 1 (Owner):', ownedOrg ? 'Found' : 'Not Found');

    // 3. Mock Logic Step 2 (Profile)
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    console.log('Step 2 (Profile Org ID):', profile?.organization_id || 'None');

    // 4. Mock Logic Step 3 (Fallback Slug)
    console.log(`Step 3 (Fallback Check): Looking for slug '${MOCK_LOCAL_STORAGE_SLUG}'`);
    const { data: slugOrg, error: slugError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', MOCK_LOCAL_STORAGE_SLUG)
        .single();

    if (slugOrg) {
        console.log('✅ Step 3 Success: Found Org:', slugOrg.name, slugOrg.id);
        console.log('   -> This Org ID would be passed to SettingsContext.');

        // 5. Verify Settings Fetch
        const { data: settings } = await supabase.from('settings').select('*').eq('organization_id', slugOrg.id).single();
        console.log('   -> Settings Found:', settings ? 'Yes' : 'No');
        if (settings) {
            console.log('   -> Primary Color:', settings.primary_color);
        }
    } else {
        console.error('❌ Step 3 Failed:', slugError);
    }
}

debugContext();
