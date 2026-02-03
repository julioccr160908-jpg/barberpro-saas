const { createClient } = require('@supabase/supabase-js');

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(NEW_URL, NEW_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const EMAIL = 'julioccr1609@gmail.com';

async function fixJulio() {
    console.log(`🔍 Diagnosticano ${EMAIL}...`);

    // 1. Verificar Profile
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('email', EMAIL).single();

    if (pError) {
        console.log(`❌ Profile não encontrado ou erro: ${pError.message}`);

        // Tentar encontrar pelo Auth para recriar profile se necessário
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const authUser = users.find(u => u.email === EMAIL);

        if (authUser) {
            console.log(`✅ Usuário Auth encontrado: ${authUser.id}`);
            console.log('REPARO: Criando profile para o usuário...');

            const { error: insError } = await supabase.from('profiles').insert({
                id: authUser.id,
                email: EMAIL,
                name: 'Julio Cesar',
                role: 'SUPER_ADMIN'
            });

            if (insError) console.log(`   ❌ Falha ao criar profile: ${insError.message}`);
            else console.log('   ✅ Profile criado com sucesso!');

        } else {
            console.log('❌ Usuário nem existe no Auth! Criando do zero...');
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: EMAIL,
                password: '123456',
                email_confirm: true,
                user_metadata: { name: 'Julio Cesar', role: 'SUPER_ADMIN' }
            });

            if (createError) console.log(`   ❌ Erro fatal criando user: ${createError.message}`);
            else {
                console.log('   ✅ Usuário criado do zero!');
                // Criar profile
                await supabase.from('profiles').insert({
                    id: newUser.user.id,
                    email: EMAIL,
                    name: 'Julio Cesar',
                    role: 'SUPER_ADMIN'
                });
            }
            return; // Retorna pois já criamos com senha certa
        }
    } else {
        console.log(`✅ Profile encontrado: ${profile.id} (Role: ${profile.role})`);
    }

    // 2. Resetar Senha (se já existia ou se recuperamos profile)
    // Precisamos do ID. Se profile existia, usamos profile.id. Se não, pegamos de authUser acima.
    // Vamos buscar ID de novo para garantir
    const { data: finalProfile } = await supabase.from('profiles').select('id').eq('email', EMAIL).single();

    if (finalProfile) {
        const { error: resetError } = await supabase.auth.admin.updateUserById(
            finalProfile.id,
            { password: '123456' }
        );

        if (resetError) console.log(`❌ Erro ao resetar senha: ${resetError.message}`);
        else console.log('✅ Senha redefinida para: 123456');
    }
}

fixJulio();
