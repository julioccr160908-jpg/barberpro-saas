const { createClient } = require('@supabase/supabase-js');

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEW_URL, NEW_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = [
    'dono1@gmail.com',
    'julioccr1609@gmail.com',
    'dono2@gmail.com',
    'barber1@gmail.com',
    'barber2@gmail.com',
    'cliente1@gmail.com',
    'cliente2@gmail.com'
];

async function resetPasswords() {
    console.log('🔑 Resetando senhas para 123456...\n');

    for (const email of USERS) {
        // Buscar ID do usuário (não tem busca direta por email na admin api facilmente sem listar, 
        // mas vamos tentar update direto se conseguirmos o ID da tabela profiles que migramos)

        // Melhor: Listar usuários do Auth
        // Nota: listUsers não filtra por email diretamente na v2, mas vamos pegar todos

        // Abordagem hibrida: Pegar ID da tabela profiles (que já migramos e tem os mesmos IDs do Auth)
        const { data: profile, error } = await supabase.from('profiles').select('id').eq('email', email).single();

        if (profile) {
            const { data, error: uError } = await supabase.auth.admin.updateUserById(
                profile.id,
                { password: '123456' }
            );

            if (uError) {
                console.log(`❌ Erro ao resetar ${email}: ${uError.message}`);
            } else {
                console.log(`✅ Senha de ${email} definida para: 123456`);
            }
        } else {
            console.log(`⚠️ Usuário não encontrado em profiles: ${email}`);
        }
    }
}

resetPasswords();
