const { Client } = require('pg');

async function verify() {
    // Connection string used successfully in previous scripts
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    });

    try {
        await client.connect();

        console.log("=== VERIFICAÇÃO DE INTEGRIDADE DE DADOS ===");

        const tables = ['organizations', 'profiles', 'appointments', 'services', 'settings'];

        for (const table of tables) {
            const res = await client.query(`SELECT count(*) FROM ${table}`);
            console.log(`Tabela '${table}': ${res.rows[0].count} registros`);

            if (parseInt(res.rows[0].count) === 0 && table === 'profiles') {
                console.error("ALERTA: Tabela profiles está vazia!");
            }
        }

        console.log("\n--- Amostra de Organizações ---");
        const orgs = await client.query("SELECT id, name, slug FROM organizations LIMIT 3");
        console.log(JSON.stringify(orgs.rows, null, 2));

        console.log("\n--- Amostra de Usuários (Profiles) ---");
        const users = await client.query("SELECT id, name, email, role FROM profiles LIMIT 3");
        console.log(JSON.stringify(users.rows, null, 2));

        console.log("\n✅ Verificação Concluída.");

    } catch (e) {
        console.error("❌ Falha na Verificação:", e);
    } finally {
        await client.end();
    }
}

verify();
