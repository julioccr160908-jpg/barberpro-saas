
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: settings } = await supabase.from('settings').select('*').limit(1);
    console.log("Settings columns:", settings && settings.length > 0 ? Object.keys(settings[0]) : "Empty table");

    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles columns:", profiles && profiles.length > 0 ? Object.keys(profiles[0]) : "Empty table");
}
check();
