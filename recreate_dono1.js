import { createClient } from '@supabase/supabase-js';

// Config
const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createDono() {
    console.log('Creating user body1@gmail.com...');

    const { data, error } = await supabase.auth.admin.createUser({
        email: 'dono1@gmail.com',
        password: '123456',
        email_confirm: true,
        user_metadata: { name: 'Dono Barbearia' }
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created successfully:', data.user.id);

        // Now we need to link this NEW ID to the organization
        // We can print the ID to console and I'll use a subsequent SQL command to link it
        // Or I can do it here if I had sql access, but I don't via JS easily without another lib.
        // I'll rely on the output to run a SQL command next.
    }
}

createDono();
