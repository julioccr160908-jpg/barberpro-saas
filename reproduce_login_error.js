
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcmJlcnByby1zYWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ5MjE2MDAsImV4cCI6MjAyMDk2NDgwMH0.N_2-Wv1_Sg9c39l-Sg9c39l-Sg9c39l-Sg9c39l-Sg9c'; // Anon key usually sufficient for login

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

async function testLogin() {
    console.log('Attempting login for julioccr1609@gmail.com...');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'julioccr1609@gmail.com',
        password: 'Julioccr2020',
    });

    if (error) {
        console.error('Login Failed!');
        console.error('Error Message:', error.message);
        console.error('Error Status:', error.status);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Login Successful!');
        console.log('User ID:', data.user.id);
        console.log('Session Access Token:', data.session.access_token.substring(0, 20) + '...');
    }
}

testLogin();
