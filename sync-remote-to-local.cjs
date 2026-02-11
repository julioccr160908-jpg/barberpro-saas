// Script to sync remote Supabase data to local instance
// Usage: node sync-remote-to-local.cjs

const REMOTE_URL = 'https://ybzgpqwanlbpmyxwjjxc.supabase.co';
const SERVICE_KEY = process.env.SERVICE_KEY || 'PLACEHOLDER_KEY';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = process.env.LOCAL_SERVICE_KEY || 'PLACEHOLDER_KEY';

async function fetchRemote(endpoint, isRest = true) {
    const url = isRest
        ? `${REMOTE_URL}/rest/v1/${endpoint}`
        : `${REMOTE_URL}${endpoint}`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY
        }
    });
    return res.json();
}

async function postLocal(endpoint, data, isRest = true) {
    const url = isRest
        ? `${LOCAL_URL}/rest/v1/${endpoint}`
        : `${LOCAL_URL}${endpoint}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LOCAL_SERVICE_KEY}`,
            'apikey': LOCAL_SERVICE_KEY,
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST ${endpoint} failed: ${res.status} - ${text}`);
    }
    return res;
}

async function sync() {
    console.log('🔄 Starting sync from remote to local...\n');

    // 1. Sync Auth Users
    console.log('👤 Syncing auth users...');
    const usersData = await fetchRemote('/auth/v1/admin/users', false);

    if (!usersData.users) {
        console.error('❌ Failed to fetch users:', usersData);
        return;
    }

    for (const user of usersData.users) {
        try {
            // Check if user exists locally
            const checkRes = await fetch(`${LOCAL_URL}/auth/v1/admin/users/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${LOCAL_SERVICE_KEY}`,
                    'apikey': LOCAL_SERVICE_KEY
                }
            });

            if (checkRes.ok) {
                console.log(`  ⏩ User ${user.email} already exists, skipping`);
                continue;
            }

            // Create user locally
            const createRes = await fetch(`${LOCAL_URL}/auth/v1/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${LOCAL_SERVICE_KEY}`,
                    'apikey': LOCAL_SERVICE_KEY
                },
                body: JSON.stringify({
                    email: user.email,
                    password: '123456', // Default password for local dev
                    email_confirm: true,
                    user_metadata: user.user_metadata || {},
                    app_metadata: user.app_metadata || {},
                    id: user.id
                })
            });

            if (createRes.ok) {
                console.log(`  ✅ Created user: ${user.email}`);
            } else {
                const err = await createRes.text();
                // ignore email exists errors
                if (err.includes('email_exists')) {
                    console.log(`  ⏩ User ${user.email} email already taken`);
                } else {
                    console.log(`  ⚠️ User ${user.email}: ${err}`);
                }
            }
        } catch (e) {
            console.log(`  ⚠️ User ${user.email}: ${e.message}`);
        }
    }

    // 2. Sync Public Tables (in dependency order)
    const tables = [
        'organizations',
        'profiles',
        'services',
        'settings',
        'appointments',
        'notification_templates',
        'notification_logs',
        'expenses'
    ];

    for (const table of tables) {
        console.log(`\n📦 Syncing ${table}...`);
        try {
            const data = await fetchRemote(`${table}?select=*`);

            if (!Array.isArray(data)) {
                console.log(`  ⚠️ Unexpected response for ${table}:`, JSON.stringify(data).substring(0, 100));
                continue;
            }

            if (data.length === 0) {
                console.log(`  ⏩ No data in ${table}`);
                continue;
            }

            // Upsert in batches of 50
            const batchSize = 50;
            for (let i = 0; i < data.length; i += batchSize) {
                let batch = data.slice(i, i + batchSize);

                // Data Transformations
                batch = batch.map(row => {
                    // Map expenses: title -> description
                    if (table === 'expenses') {
                        if (row.title !== undefined) {
                            row.description = row.title;
                            // We keep row.title so it also populates the 'title' column if it exists
                        }
                    }
                    // notification_templates: schema mismatch fixed via SQL, so direct mapping should work for is_active/content
                    return row;
                });

                try {
                    await postLocal(table, batch);
                    console.log(`  ✅ Upserted ${batch.length} rows in ${table}`);
                } catch (e) {
                    console.log(`  ⚠️ Error in ${table}: ${e.message}`);

                    // Try one by one
                    for (const row of batch) {
                        try {
                            await postLocal(table, row);
                        } catch (e2) {
                            // Ignore duplicate key errors for profiles (triggers)
                            if (table === 'profiles' && e2.message.includes('23505')) {
                                console.log(`    ⏩ Profile already exists: ${row.email}`);
                                continue;
                            }
                            console.log(`    ❌ Row ${row.id}: ${e2.message.substring(0, 100)}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log(`  ⚠️ Skipping ${table}: ${e.message}`);
        }
    }

    console.log('\n🎉 Sync complete!');

    // Verify
    console.log('\n📊 Verification:');
    const localUsersRes = await fetch(`${LOCAL_URL}/auth/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${LOCAL_SERVICE_KEY}`, 'apikey': LOCAL_SERVICE_KEY }
    });
    const localUsers = await localUsersRes.json();
    console.log(`  Auth users: ${localUsers.users?.length || 0}`);

    for (const table of tables) {
        if (table === 'notification_logs') continue;
        const res = await fetch(`${LOCAL_URL}/rest/v1/${table}?select=count`, {
            headers: {
                'Authorization': `Bearer ${LOCAL_SERVICE_KEY}`,
                'apikey': LOCAL_SERVICE_KEY,
                'Prefer': 'count=exact'
            }
        });
        const count = res.headers.get('content-range');
        console.log(`  ${table}: ${count}`);
    }
}

sync().catch(e => console.error('Fatal:', e));
