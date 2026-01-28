
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateAdmin() {
    console.log("Creating Admin User via API...");
    const email = 'julio1609@gmail.com';
    const password = 'Julioccr2020';

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: 'Super Admin',
                full_name: 'Super Admin'
            }
        }
    });

    if (error) {
        console.error("Error creating user:", error);
    } else {
        console.log("User created successfully:", data.user?.id);
    }
}

recreateAdmin();
