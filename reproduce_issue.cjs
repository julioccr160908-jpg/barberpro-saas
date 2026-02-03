
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🔄 Reproducing 400 Bad Request on Appointments...");

    const orgId = 'bb9c6bf5-73ee-4ff9-9bd2-a75f5460d912';

    try {
        const { data, error } = await supabase.from('appointments').select(`
            *,
            service:service_id (name, price, duration_minutes),
            barber:barber_id (name),
            customer:customer_id (name, phone, avatar_url)
        `).eq('organization_id', orgId);

        if (error) {
            console.error("❌ Error captured:", JSON.stringify(error, null, 2));
        } else {
            console.log("✅ Success! Rows:", data.length);
        }

    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

run();
