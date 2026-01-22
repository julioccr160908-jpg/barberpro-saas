# Relatório de Solução de Problemas: Autenticação e Login

Este documento resume os problemas de autenticação enfrentados, as causas raiz identificadas e as soluções implementadas no ambiente BarberPro SaaS (Supabase Local + Docker).

## 1. Problema: Login Travado (Timeout/Indefinido)

### 🔴 Sintoma
Ao clicar em "Entrar", o botão ficava em estado de carregamento indefinidamente ou demorava mais de 2 minutos sem resposta.

### 🔍 Causa Raiz
1.  **Sessão Inválida (Client-Side):** O navegador armazenava um *Refresh Token* antigo ou inválido. O Supabase tentava renovar a sessão falha, gerando erros `Invalid Refresh Token` em loop, travando a requisição.
2.  **Falta de Resposta do Backend:** Em alguns casos, a requisição de rede ficava pendente devido a configurações de rede lociais (`localhost` vs `127.0.0.1`).

### ✅ Solução Implementada
*   **Instrumentação do Frontend (`Login.tsx`):** Adicionamos um *timeout* de segurança (8 a 10 segundos). Se o backend não responder a busca de perfil nesse tempo, o sistema força o redirecionamento ou exibe erro, evitando o "loop eterno".
*   **Logs Detalhados:** Inclusão de `console.log` ("Auth Start", "Auth Done") para rastrear exatamente onde o processo parava.
*   **Recomendação Operacional:** Uso de Aba Anônima ou limpeza de `Local Storage` para descartar sessões viciadas.

---

## 2. Problema: Erro 406 / Travamento pós-login

### 🔴 Sintoma
O login na autenticação (Auth) passava (retorno 200 OK), mas o usuário não era redirecionado. O console exibia erro `406 Not Acceptable` na chamada `supabase.from('profiles').select().single()`.

### 🔍 Causa Raiz
*   **Perfil Inexistente:** O usuário existia na tabela de autenticação (`auth.users`), mas não possuía registro correspondente na tabela de dados da aplicação (`public.profiles`).
*   **Método `.single()`:** O código frontend espera obrigatoriamente 1 linha. Se a consulta retorna 0 linhas (perfil não criado), o Supabase retorna erro 406/JSON Error, que não era tratado corretamente, travando o fluxo.

### ✅ Solução Implementada
*   **Correção Manual:** Inserção manual dos perfis faltantes via SQL.
*   **Automação (Trigger):** Criação/Restauro do trigger de banco de dados (`on_auth_user_created`) que cria automaticamente uma linha em `public.profiles` sempre que um novo usuário se cadastra.
    ```sql
    -- Exemplo do Trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    ```

---

## 3. Problema: "Database User Error" / Metadados Nulos

### 🔴 Sintoma
Erro genérico ao tentar logar ou falta de nome/email no painel.

### 🔍 Causa Raiz
Usuários antigos ou criados manualmente sem o campo `raw_user_meta_data` populado corretamente. Isso quebrava triggers e funções que dependiam desses dados (ex: `new.raw_user_meta_data->>'full_name'`).

### ✅ Solução Implementada
*   **Script de Correção (`recreate_complete_user.sql`):** Script SQL robusto para recriar usuários garantindo que todos os metadados e identidades estejam preenchidos corretamente desde a origem.

---

## 🩺 Checklist para Problemas Futuros

Se o login voltar a falhar, siga este roteiro:

1.  **Limpe o Navegador:** Teste em Aba Anônima para eliminar cache viciado.
2.  **Verifique Logs do Frontend:** Abra o Console (F12) e procure pelos logs `Login.tsx: ...`.
    *   Se travar em "Auth Start" -> Problema de Rede/Supabase Auth.
    *   Se travar em "Fetching Profile" -> Problema na tabela `profiles` ou RLS.
3.  **Verifique Logs do Backend:**
    ```bash
    docker logs --tail 50 supabase_auth_barberpro-saas
    ```
4.  **Valide o Perfil:** Verifique se o ID do usuário em `auth.users` existe em `public.profiles`.
