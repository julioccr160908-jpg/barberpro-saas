
const { createClient } = require('@supabase/supabase-js');

// Use local Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3RzdHJhcCIsInJvbGUiOiJpbnNlcnRfYW5vbl9rZXkiLCJpYXQiOjE2MTY1NTM1ODgsImV4cCI6NDc3MjE1MzU4OH0.QrN_-kZX7_wS_wh-p9p1_ev5_2S-W5_2S-W5_2S-W5'; // Standard local key

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySmartRedirect() {
    const email = 'cliente1@gmail.com';
    const password = '123456';

    console.log(`\n🔍 Verifying Smart Redirect Logic for: ${email}`);

    // 1. Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Login Failed:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log('✅ Login Successful. User ID:', userId);

    // 2. Simulate the Frontend Logic
    console.log('\n🔄 Simulating "Smart Redirect" Query...');

    // Step A: Find last appointment
    const { data: lastAppt, error: apptError } = await supabase
        .from('appointments')
        .select('organization_id, created_at, date')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (apptError) {
        if (apptError.code === 'PGRST116') { // No rows found
            console.log('⚠️ No appointments found for this user.');
            console.log('➡ Frontend Result: Redirect to default /book');
            return;
        }
        console.error('❌ Error fetching appointments:', apptError);
        return;
    }

    console.log('found Appointment:', {
        id: lastAppt.id,
        orgId: lastAppt.organization_id,
        date: lastAppt.date
    });

    if (!lastAppt.organization_id) {
        console.log('⚠️ Appointment has no Organization ID.');
        return;
    }

    // Step B: Get Organization Slug
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('name, slug')
        .eq('id', lastAppt.organization_id)
        .single();

    if (orgError) {
        console.error('❌ Error fetching organization:', orgError);
        return;
    }

    console.log('✅ Found Organization:', org.name);
    console.log(`\n🎯 FINAL REDIRECT: /${org.slug}`);
    console.log('(This matches the user request to be sent to the correct shop page)');

}

verifySmartRedirect();
