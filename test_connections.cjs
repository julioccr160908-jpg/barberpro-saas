/**
 * Test all connections: Supabase Local, Supabase Remote, Evolution API
 */

const TESTS = [];

function log(label, status, detail = '') {
    const icon = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    const msg = `${icon} ${label}: ${status}${detail ? ' - ' + detail : ''}`;
    console.log(msg);
    TESTS.push({ label, status, detail });
}

async function testSupabaseLocal() {
    console.log('\n🔹 1. SUPABASE LOCAL (DB via pg)');
    try {
        const { Client } = require('pg');
        const client = new Client({
            connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
        });
        await client.connect();
        const res = await client.query('SELECT count(*) as total FROM profiles');
        log('DB Local (pg)', 'OK', `${res.rows[0].total} profiles encontrados`);

        // Check tables
        const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
        log('Tabelas públicas', 'OK', `${tables.rows.length} tabelas: ${tables.rows.map(r => r.table_name).join(', ')}`);

        await client.end();
    } catch (err) {
        log('DB Local (pg)', 'FAIL', err.message);
    }
}

async function testSupabaseLocalAPI() {
    console.log('\n🔹 2. SUPABASE LOCAL API (REST)');
    try {
        const res = await fetch('http://127.0.0.1:54321/rest/v1/profiles?select=id&limit=3', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
            }
        });
        const data = await res.json();
        if (res.ok) {
            log('REST API Local', 'OK', `Status ${res.status}, ${data.length} profiles retornados`);
        } else {
            log('REST API Local', 'FAIL', `Status ${res.status}: ${JSON.stringify(data)}`);
        }
    } catch (err) {
        log('REST API Local', 'FAIL', err.message);
    }
}

async function testSupabaseLocalAuth() {
    console.log('\n🔹 3. SUPABASE LOCAL AUTH');
    try {
        const res = await fetch('http://127.0.0.1:54321/auth/v1/health', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
            }
        });
        const text = await res.text();
        log('Auth Service', res.ok ? 'OK' : 'FAIL', `Status ${res.status} - ${text.substring(0, 100)}`);
    } catch (err) {
        log('Auth Service', 'FAIL', err.message);
    }
}

async function testSupabaseLocalStorage() {
    console.log('\n🔹 4. SUPABASE LOCAL STORAGE');
    try {
        const res = await fetch('http://127.0.0.1:54321/storage/v1/bucket', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
            }
        });
        const data = await res.json();
        if (res.ok) {
            log('Storage Service', 'OK', `${data.length} buckets: ${data.map(b => b.name).join(', ')}`);
        } else {
            log('Storage Service', 'FAIL', `Status ${res.status}`);
        }
    } catch (err) {
        log('Storage Service', 'FAIL', err.message);
    }
}

async function testSupabaseRemote() {
    console.log('\n🔹 5. SUPABASE REMOTO (Produção)');
    try {
        const res = await fetch('https://ybzgpqwanlbpmyxwjjxc.supabase.co/rest/v1/', {
            headers: {
                'apikey': 'sb_publishable_QHwdmpgvzI5FcPFotPhfiA_yrB8k4Cr'
            }
        });
        log('Supabase Remoto', res.ok || res.status === 200 ? 'OK' : 'WARN', `Status ${res.status}`);
    } catch (err) {
        log('Supabase Remoto', 'FAIL', err.message);
    }
}

async function testEvolutionAPI() {
    console.log('\n🔹 6. EVOLUTION API (WhatsApp)');
    // Test local Docker instance
    try {
        const res = await fetch('http://localhost:8081/manager/info', {
            headers: {
                'apikey': 'B3736524-7663-4700-9189-548348705055'
            }
        });
        const text = await res.text();
        log('Evolution API Local', res.ok ? 'OK' : 'WARN', `Status ${res.status} - ${text.substring(0, 200)}`);
    } catch (err) {
        log('Evolution API Local', 'FAIL', err.message);
    }

    // Test remote Evolution API (from .env.local)
    try {
        const res = await fetch('https://evolution.barberhost.com.br/manager/info', {
            headers: {
                'apikey': '429683C4C977415CAAFCCE10F7D57E11'
            }
        });
        const text = await res.text();
        log('Evolution API Remota', res.ok ? 'OK' : 'WARN', `Status ${res.status} - ${text.substring(0, 200)}`);
    } catch (err) {
        log('Evolution API Remota', 'FAIL', err.message);
    }
}

async function testEvolutionInstance() {
    console.log('\n🔹 7. EVOLUTION API - Instância WhatsApp');
    // Check instance status
    try {
        const res = await fetch('http://localhost:8081/instance/fetchInstances', {
            headers: {
                'apikey': 'B3736524-7663-4700-9189-548348705055'
            }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
            log('Instâncias WhatsApp', 'OK', `${data.length} instância(s) encontrada(s)`);
            data.forEach(inst => {
                const name = inst.instance?.instanceName || inst.name || 'unknown';
                const state = inst.instance?.state || inst.state || 'unknown';
                log(`  Instância "${name}"`, state === 'open' ? 'OK' : 'WARN', `Estado: ${state}`);
            });
        } else {
            log('Instâncias WhatsApp', 'WARN', `Status ${res.status}: ${JSON.stringify(data).substring(0, 200)}`);
        }
    } catch (err) {
        log('Instâncias WhatsApp', 'FAIL', err.message);
    }
}

async function testStudio() {
    console.log('\n🔹 8. SUPABASE STUDIO');
    try {
        const res = await fetch('http://127.0.0.1:54323');
        log('Supabase Studio', res.ok ? 'OK' : 'WARN', `Status ${res.status} - http://127.0.0.1:54323`);
    } catch (err) {
        log('Supabase Studio', 'FAIL', err.message);
    }
}

async function testCloudflare() {
    console.log('\n🔹 9. CLOUDFLARE TUNNEL (evolution.barberhost.com.br)');
    try {
        const res = await fetch('https://evolution.barberhost.com.br/', {
            method: 'GET',
            signal: AbortSignal.timeout(10000)
        });
        log('Cloudflare Tunnel', res.ok || res.status < 500 ? 'OK' : 'WARN', `Status ${res.status}`);
    } catch (err) {
        log('Cloudflare Tunnel', 'FAIL', err.message);
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   BARBERHOST SaaS - Teste de Conexões');
    console.log('   ' + new Date().toLocaleString('pt-BR'));
    console.log('═══════════════════════════════════════════════════════');

    await testSupabaseLocal();
    await testSupabaseLocalAPI();
    await testSupabaseLocalAuth();
    await testSupabaseLocalStorage();
    await testSupabaseRemote();
    await testEvolutionAPI();
    await testEvolutionInstance();
    await testStudio();
    await testCloudflare();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   RESUMO');
    console.log('═══════════════════════════════════════════════════════');
    const ok = TESTS.filter(t => t.status === 'OK').length;
    const warn = TESTS.filter(t => t.status === 'WARN').length;
    const fail = TESTS.filter(t => t.status === 'FAIL').length;
    console.log(`   ✅ OK: ${ok}  |  ⚠️ WARN: ${warn}  |  ❌ FAIL: ${fail}`);
    console.log('═══════════════════════════════════════════════════════');
}

main().catch(console.error);
