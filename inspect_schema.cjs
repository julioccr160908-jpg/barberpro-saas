
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3RzdHJhcCIsInJvbGUiOiJpbnNlcnRfYW5vbl9rZXkiLCJpYXQiOjE2MTY1NTM1ODgsImV4cCI6NDc3MjE1MzU4OH0.QrN_-kZX7_wS_wh-p9p1_ev5_2S-W5_2S-W5_2S-W5';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const email = 'dono1@gmail.com';
    const password = '123456';

    console.log(`\n🔐 Authenticating as ${email}...`);
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
        console.error('❌ Auth Failed:', authErr);
        return;
    }
    console.log('✅ Auth Success');

    console.log('Fetching one settings row...');
    const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Keys in settings table:', Object.keys(settings));
    console.log('Full Row:', settings);
}

inspect();
