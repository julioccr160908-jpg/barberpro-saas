
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSchedule() {
    console.log("Debugging Schedule for barbearia-1...");

    // 1. Get Org ID
    const { data: org, error: orgError } = await supabase.from('organizations').select('id').eq('slug', 'barbearia-1').single();
    if (orgError || !org) {
        console.error("Org not found:", orgError);
        return;
    }
    console.log("Org ID:", org.id);

    // 2. Get Settings
    const { data: settings, error: settingsError } = await supabase.from('settings').select('*').eq('organization_id', org.id).single();
    if (settingsError) {
        console.error("Settings error:", settingsError);
        return;
    }

    console.log("\n--- Schedule Data ---");
    console.log("Interval Minutes:", settings.interval_minutes);
    const schedule = settings.schedule;

    if (!Array.isArray(schedule)) {
        console.error("Schedule is not an array:", schedule);
    } else {
        console.log("Schedule Entries:", schedule.length);

        // Check Monday (Day 1)
        const monday = schedule.find(d => d.dayId === 1);
        console.log("Monday Config:", monday);

        // Check Sunday (Day 0) - just in case
        const sunday = schedule.find(d => d.dayId === 0);
        console.log("Sunday Config:", sunday);
    }

    const testDate = new Date('2026-02-02T10:00:00');
    console.log("\nTest Date:", testDate.toISOString());
    console.log("Day of Week:", testDate.getDay());
}

debugSchedule();
