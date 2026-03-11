
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => {
    const [key, ...value] = line.split('=');
    return [key.trim(), value.join('=').trim().replace(/^"(.*)"$/, '$1')];
}));

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('--- Listing ALL subscriptions ---');
    const { data: subs, error: subErr } = await supabase
        .from('customer_subscriptions')
        .select(`
            *,
            customer:profiles(name)
        `);
    
    if (subErr) {
        console.error('Error fetching subs:', subErr.message);
        return;
    }

    console.log(`Total subscriptions found: ${subs.length}`);
    subs.forEach(s => {
        console.log(`- ID: ${s.id}, Customer: ${s.customer?.name}, Status: ${s.status}, Created: ${s.created_at}`);
    });

    // We can then automatically fix duplicates if we see them
    const userMap = {};
    for (const sub of subs) {
        const key = `${sub.customer_id}-${sub.organization_id}`;
        if (!userMap[key]) userMap[key] = [];
        userMap[key].push(sub);
    }

    for (const key in userMap) {
        const userSubs = userMap[key];
        if (userSubs.length > 1) {
            console.log(`\nFound ${userSubs.length} duplicates for user ${userSubs[0].customer?.name} (Org: ${userSubs[0].organization_id})`);
            const [keep, ...others] = userSubs;
            
            console.log(`Activating ${keep.id}`);
            await supabase.from('customer_subscriptions').update({ status: 'active' }).eq('id', keep.id);
            
            for (const other of others) {
                console.log(`Deleting ${other.id}`);
                await supabase.from('customer_subscriptions').delete().eq('id', other.id);
            }
        } else if (userSubs.length === 1 && userSubs[0].status === 'pending') {
            console.log(`\nActivating pending sub for ${userSubs[0].customer?.name}: ${userSubs[0].id}`);
            await supabase.from('customer_subscriptions').update({ status: 'active' }).eq('id', userSubs[0].id);
        }
    }
}

cleanup();
