# 🔑 Credenciais de Acesso - BarberPro SaaS

## Usuários de Teste Criados

### 👨‍💼 **Admin Principal**
```
Email:    admin@barberpro.com
Senha:    admin123
Role:     ADMIN
Acesso:   Dashboard, Agenda, Profissionais, Serviços, Configurações
```

### ✂️ **Barbeiro**
```
Email:    barbeiro@barberpro.com
Senha:    barber123
Role:     BARBER
Acesso:   Agenda (somente visualização/edição de próprios agendamentos)
```

---

## 🚀 Como Fazer Login

1. **Acesse**: `http://localhost:3000`
2. Na tela inicial, clique em **"Entrar como Dono (Admin)"** ou **"Área do Cliente"**
3. Insira as credenciais acima
4. ✅ Você será redirecionado para a área administrativa

---

## 🔐 Segurança

### ⚠️ **IMPORTANTE - DESENVOLVIMENTO**
- Estas credenciais são **APENAS PARA DESENVOLVIMENTO LOCAL**
- **NUNCA** use senhas simples como "admin123" em produção
- Altere todas as senhas antes de fazer deploy

### 📝 **Para Produção**
1. **Deletar usuários de teste**:
   ```sql
   DELETE FROM auth.users WHERE email IN ('admin@barberpro.com', 'barbeiro@barberpro.com');
   DELETE FROM profiles WHERE email IN ('admin@barberpro.com', 'barbeiro@barberpro.com');
   ```

2. **Criar usuários reais** via interface de cadastro
3. **Implementar**:
   - Verificação de email
   - Senha forte (mínimo 8 caracteres, maiúsculas, números, símbolos)
   - Two-Factor Authentication (2FA)
   - Rate limiting no login

---

## 🐛 Solução de Problemas

### Erro 400 (Bad Request) no Login
✅ **Resolvido**: Usuários de teste criados

### Ainda não consegue fazer login?
1. Verifique se o Supabase está rodando:
   ```bash
   npx supabase status
   ```

2. Verifique se os usuários existem:
   ```bash
   docker exec supabase_db_barberpro-saas psql -U postgres -d postgres -c "SELECT email, role FROM profiles;"
   ```

3. Reset do banco (CUIDADO - apaga tudo):
   ```bash
   npx supabase db reset
   ```

---

## 📊 Outros Usuários no Banco

Verifique usuários existentes:
```bash
docker exec supabase_db_barberpro-saas psql -U postgres -d postgres -c "SELECT id, email, role FROM profiles ORDER BY role;"
```

---

**Última atualização**: 2025-12-11
