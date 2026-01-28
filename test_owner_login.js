
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOwnerLogin() {
    console.log("=== TESTING OWNER LOGIN (dono1) ===");
    const email = 'dono1@gmail.com';
    const password = '123456'; // Trying 123456 based on previous context, or we might need to reset it.

    // Explicitly using 123456 as seen in screenshot (hidden, but common default) and previous context.
    // My previous thought mentioned 123456.

    console.time("Login Duration");
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        console.timeEnd("Login Duration");

        if (error) {
            console.error("❌ Login Failed:", error.message);
        } else {
            console.log("✅ Login Successful!");
            console.log("   User ID:", data.user.id);
            console.log("   Email:", data.user.email);

            console.time("Profile Fetch Duration");
            // Check Profile Role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, name')
                .eq('id', data.user.id)
                .single();
            console.timeEnd("Profile Fetch Duration");

            if (profileError) {
                console.error("❌ Profile Fetch Failed:", profileError.message);
            } else {
                console.log("✅ Profile Fetched!");
                console.log("   Role:", profile.role);
                console.log("   Name:", profile.name);
            }
        }
    } catch (err) {
        console.error("Exception:", err);
    }
}

testOwnerLogin();
