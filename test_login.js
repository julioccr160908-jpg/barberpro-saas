
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log("=== INICIANDO TESTE DE LOGIN ===");

    // 1. Test Admin Login
    console.log("\n1. Testando Login ADMIN (julioccr1609@gmail.com)...");
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'julio1609@gmail.com',
            password: 'Julioccr2020'
        });

        if (error) {
            console.error("❌ Erro no Login Admin:", error.message);
        } else {
            console.log("✅ Sucesso Login Admin!");
            console.log("   User ID:", data.user.id);

            // Check Profile Role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();
            console.log("   Role no DB:", profile?.role);
        }
    } catch (err) {
        console.error("Exception Admin:", err);
    }

    // 2. Test Customer Login (Recentemente criado)
    console.log("\n2. Testando Login CLIENTE (teste@gmail.com)...");
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'teste@gmail.com',
            password: 'Password123!' // Senha provavel de teste ou vamos redefinir
        });

        if (error) {
            console.log("ℹ️ Login normal falhou (provavelmente senha incorreta), tentando criar novo user para teste de login...");
            // Create fresh user for login test
            const testEmail = `login_test_${Date.now()}@gmail.com`;
            const testPass = 'LoginPass123!';

            await supabase.auth.signUp({
                email: testEmail,
                password: testPass,
                options: { data: { name: 'Login Tester' } }
            });

            console.log(`   Novo usuário criado: ${testEmail}`);

            // Try logging in with new user
            const { data: newData, error: newError } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: testPass
            });

            if (newError) console.error("❌ Falha no login do novo usuário:", newError.message);
            else console.log("✅ Sucesso Login Novo Cliente:", newData.user.id);

        } else {
            console.log("✅ Sucesso Login Cliente Existente!");
        }
    } catch (err) {
        console.error("Exception Customer:", err);
    }
}

testLogin();
