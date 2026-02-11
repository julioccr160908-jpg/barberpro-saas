
const REMOTE_URL = 'https://ybzgpqwanlbpmyxwjjxc.supabase.co';
// Using the key found in sync-remote-to-local.cjs
const REMOTE_SERVICE_KEY = process.env.REMOTE_SERVICE_KEY || 'PLACEHOLDER_KEY';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = process.env.LOCAL_SERVICE_KEY || 'PLACEHOLDER_KEY';

async function fetchLocal(endpoint, isRest = true) {
    const url = isRest
        ? `${LOCAL_URL}/rest/v1/${endpoint}`
        : `${LOCAL_URL}${endpoint}`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${LOCAL_SERVICE_KEY}`,
            'apikey': LOCAL_SERVICE_KEY
        }
    });
    if (!res.ok) throw new Error(`Fetch Local Failed: ${res.statusText}`);
    return res.json();
}

async function postRemote(endpoint, data, isRest = true) {
    const url = isRest
        ? `${REMOTE_URL}/rest/v1/${endpoint}`
        : `${REMOTE_URL}${endpoint}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${REMOTE_SERVICE_KEY}`,
            'apikey': REMOTE_SERVICE_KEY,
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST Remote ${endpoint} failed: ${res.status} - ${text}`);
    }
    return res;
}

async function sync() {
    console.log('🚀 Starting sync from LOCAL to REMOTE...\n');

    // 1. Sync Auth Users
    console.log('👤 Syncing auth users...');
    const usersData = await fetchLocal('/auth/v1/admin/users', false);

    if (!usersData.users) {
        console.error('❌ Failed to fetch local users');
        return;
    }

    for (const user of usersData.users) {
        try {
            // Check if user exists remote
            const checkRes = await fetch(`${REMOTE_URL}/auth/v1/admin/users/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${REMOTE_SERVICE_KEY}`,
                    'apikey': REMOTE_SERVICE_KEY
                }
            });

            if (checkRes.ok) {
                console.log(`  ⏩ User ${user.email} already exists, updating metadata if needed`);
                // Optional: Update metadata?
                continue;
            }

            // Create user remotely
            const createRes = await fetch(`${REMOTE_URL}/auth/v1/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${REMOTE_SERVICE_KEY}`,
                    'apikey': REMOTE_SERVICE_KEY
                },
                body: JSON.stringify({
                    id: user.id,
                    email: user.email,
                    password: '123456', // PASSWORD RESET DEFAULT
                    email_confirm: true,
                    user_metadata: user.user_metadata || {},
                    app_metadata: user.app_metadata || {}
                })
            });

            if (createRes.ok) {
                console.log(`  ✅ Created user: ${user.email} (Senha: 123456)`);
            } else {
                const err = await createRes.text();
                // ignore email exists errors
                if (err.includes('email_exists')) {
                    console.log(`  ⏩ User ${user.email} email already taken`);
                } else {
                    console.log(`  ⚠️ User ${user.email} ERROR: ${err}`);
                }
            }
        } catch (e) {
            console.log(`  ⚠️ User ${user.email} EXCEPTION: ${e.message}`);
        }
    }

    // 2. Sync Public Tables
    // Order matters for Foreign Keys: Organizations -> Profiles (Update) -> Services -> Appointments
    // Wait, Profiles are created by trigger. So we update them.
    // Organizations might depend on Owner (Profile).
    // So:
    // 1. Profiles (Update roles/names)
    // 2. Organizations
    // 3. Services (depends on Org)
    // 4. Appointments (depends on Org, Cust, Service, Barber)

    // Actually, Profiles might not exist if trigger didn't fire (e.g. bulk insert? Adm API usually fires trigger).
    // Let's iterate tables.

    const tables = [
        'profiles',        // Update profiles first
        'organizations',   // Then orgs
        'services',
        'settings',
        'appointments',
        'expenses',
        'notification_templates',
        'notification_logs'
    ];

    for (const table of tables) {
        console.log(`\n📦 Syncing ${table}...`);
        try {
            // Fetch all local data
            const data = await fetchLocal(`${table}?select=*`);

            if (!Array.isArray(data) || data.length === 0) {
                console.log(`  ⏩ No data in ${table}`);
                continue;
            }


            // Upsert in batches
            const batchSize = 50;
            for (let i = 0; i < data.length; i += batchSize) {
                let batch = data.slice(i, i + batchSize);

                // FIX: Map columns for schema mismatches
                if (table === 'expenses') {
                    batch = batch.map(row => {
                        if (row.description && !row.title) {
                            row.title = row.description;
                            delete row.description;
                        }
                        return row;
                    });
                }
                if (table === 'notification_templates') {
                    batch = batch.map(row => {
                        if (row.body && !row.content) {
                            row.content = row.body;
                            delete row.body;
                        }
                        return row;
                    });
                }

                try {
                    await postRemote(table, batch);
                    console.log(`  ✅ Upserted ${batch.length} rows in ${table}`);
                } catch (e) {
                    console.log(`  ⚠️ Error in ${table}: ${e.message}`);
                    // Try row by row
                    for (const row of batch) {
                        try {
                            await postRemote(table, row);
                        } catch (e2) {
                            console.log(`    ❌ Row ${row.id}: ${e2.message.substring(0, 50)}...`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log(`  ⚠️ Skipping ${table}: ${e.message}`);
        }
    }

    console.log('\n🎉 Data Sync Complete!');
    console.log('⚠️ IMPORTANTE: As senhas dos usuários foram definidas como "123456".');
}

sync().catch(e => console.error('Fatal:', e));
