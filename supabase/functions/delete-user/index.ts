// Importe os tipos necessários e o manipulador de funções do Deno.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Headers CORS para permitir que seu aplicativo web chame esta função.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey",
};

serve(async (req) => {
  // Trata a solicitação pre-flight OPTIONS para CORS.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Cria um cliente Supabase com permissões de administrador.
    // As variáveis de ambiente são injetadas automaticamente no ambiente da Edge Function.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extrai o ID do usuário do corpo da solicitação.
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("O ID do usuário (userId) é obrigatório.");
    }

    // Etapa 1: Excluir o usuário do sistema de autenticação.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      // Ignora o erro se o usuário não for encontrado (pode já ter sido removido).
      if (authError.message.toLowerCase().includes("not found")) {
        console.warn(`Usuário de autenticação ${userId} não encontrado. Prosseguindo para excluir o perfil.`);
      } else {
        throw authError;
      }
    }

    // Etapa 2: Excluir o perfil do usuário do banco de dados.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      throw profileError;
    }

    // Retorna uma resposta de sucesso.
    return new Response(JSON.stringify({ message: "Usuário excluído com sucesso." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Retorna uma resposta de erro.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
