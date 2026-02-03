
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultSchedule = [
    { "dayId": 0, "isOpen": false, "openTime": "09:00", "closeTime": "18:00" },
    { "dayId": 1, "isOpen": true, "openTime": "09:00", "closeTime": "18:00" },
    { "dayId": 2, "isOpen": true, "openTime": "09:00", "closeTime": "18:00" },
    { "dayId": 3, "isOpen": true, "openTime": "09:00", "closeTime": "18:00" },
    { "dayId": 4, "isOpen": true, "openTime": "09:00", "closeTime": "18:00" },
    { "dayId": 5, "isOpen": true, "openTime": "09:00", "closeTime": "19:00" },
    { "dayId": 6, "isOpen": true, "openTime": "09:00", "closeTime": "14:00" }
];

async function setupSchedule() {
    console.log("Setting up Schedule for barbearia-1...");

    // 1. Get Org ID
    const { data: org, error: orgError } = await supabase.from('organizations').select('id').eq('slug', 'barbearia-1').single();
    if (orgError) {
        console.error("Org not found:", orgError);
        return;
    }

    // 2. Update Settings
    const { error: updateError } = await supabase
        .from('settings')
        .update({ schedule: defaultSchedule })
        .eq('organization_id', org.id);

    if (updateError) {
        console.error("Update failed:", updateError);
    } else {
        console.log("Schedule updated successfully!");
    }
}

setupSchedule();
