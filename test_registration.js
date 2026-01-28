
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistration() {
    console.log("Starting Registration Test...");
    const email = `test_cli_${Date.now()}@gmail.com`;
    const password = 'password123';

    const start = Date.now();
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Test CLI User',
                    phone: '(11) 99999-9999'
                }
            }
        });

        const duration = Date.now() - start;
        console.log(`Call finished in ${duration}ms`);

        if (error) {
            console.error("SignUp Error:", error);
        } else {
            console.log("SignUp Success:", data);

            // Check if profile exists
            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                console.log("Profile Fetch Result:", profile, "Error:", profileError);
            }
        }
    } catch (err) {
        console.error("Exception:", err);
    }
}

testRegistration();
