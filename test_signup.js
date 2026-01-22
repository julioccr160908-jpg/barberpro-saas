
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignUp() {
    console.log("Starting SignUp Test...");
    const email = `test_script_${Date.now()}@gmail.com`;
    const password = 'Password123!';

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: 'Test Script User',
                    phone: '(11) 99999-9999'
                }
            }
        });

        if (error) {
            console.error("SignUp Error:", error);
        } else {
            console.log("SignUp Success!");
            console.log("User ID:", data.user?.id);
            console.log("Session:", data.session ? "Present" : "Missing");
        }
    } catch (err) {
        console.error("SignUp Exception:", err);
    }
}

testSignUp();
