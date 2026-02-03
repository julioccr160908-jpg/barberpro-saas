// Script para verificar quais tabelas existem no novo projeto
const { createClient } = require('@supabase/supabase-js');

const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(PROJECT_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSchema() {
    console.log('🔍 Verificando schema do novo projeto...\n');

    const tablesToCheck = ['profiles', 'services', 'organizations', 'settings', 'appointments'];

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });

        if (error && error.code === '42P01') {
            console.log(`❌ Tabela '${table}' NÃO existe.`);
        } else if (error) {
            console.log(`⚠️ Erro ao verificar '${table}': ${error.message}`);
        } else {
            console.log(`✅ Tabela '${table}' EXISTE.`);
        }
    }
}

checkSchema();
