
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSuperAdminLogin() {
    console.log("=== TESTING SUPER ADMIN LOGIN ===");
    const email = 'julioccr1609@gmail.com';
    const password = 'Julioccr2020';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("❌ Login Failed:", error.message);
        } else {
            console.log("✅ Login Successful!");
            console.log("   User ID:", data.user.id);
            console.log("   Email:", data.user.email);

            // Check Profile Role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, name')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.error("❌ Profile Fetch Failed:", profileError.message);
            } else {
                console.log("✅ Profile Fetched!");
                console.log("   Role:", profile.role);
                console.log("   Name:", profile.name);

                if (profile.role === 'SUPER_ADMIN') {
                    console.log("✅ VERIFIED: User has SUPER_ADMIN role.");
                } else {
                    console.error("❌ MISMATCH: Role is " + profile.role + ", expected SUPER_ADMIN.");
                }
            }
        }
    } catch (err) {
        console.error("Exception:", err);
    }
}

testSuperAdminLogin();
