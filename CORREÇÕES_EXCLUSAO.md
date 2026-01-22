# Correções Aplicadas - Exclusão de Profissionais

## Problemas Identificados e Resolvidos

### 1. Edge Function `delete-user` indisponível (503)
**Antes**: O código chamava `supabase.functions.invoke('delete-user')` que não estava servida localmente.

**Depois**: Implementada exclusão direta no banco de dados:
- Remove appointments vinculados ao usuário
- Remove perfil da tabela `profiles`
- **Limitação**: Usuário permanece no Auth (requer service_role key para remover completamente)

**Arquivo modificado**: `services/database.ts` (linhas 127-145)

---

### 2. Tabela `settings` vazia
**Antes**: A aplicação tentava buscar configurações de uma tabela vazia, resultando em erro 406.

**Depois**: Criada migration que insere configurações padrão:
```sql
INSERT INTO settings (id, interval_minutes, schedule) VALUES (1, 45, [...horários...])
```

**Arquivo criado**: `supabase/migrations/20241211000000_fix_settings.sql`

---

### 3. Policy de INSERT ausente na tabela settings
**Antes**: RLS bloqueava INSERT com erro 403.

**Depois**: Adicionada policy permissiva para desenvolvimento:
```sql
CREATE POLICY "Admins can insert settings" ON settings FOR INSERT WITH CHECK (true);
```

**Arquivo criado**: `supabase/migrations/20241211000001_fix_settings_policy.sql`

---

## ⚠️ Observações Importantes

### Para Produção
1. **Implementar autenticação adequada** nas policies (verificar `auth.uid()` e role)
2. **Usar Edge Function** para deletar usuários com segurança
3. **Restringir policies** baseadas em roles (apenas ADMIN pode deletar)

### Limpeza do Auth
Para remover usuários completamente do Auth (opcional):
```bash
docker exec supabase_db_barberpro-saas psql -U postgres -d postgres -c "SELECT auth.delete_user('[USER_ID]');"
```

---

## ✅ Status Atual
- ✅ Exclusão de profissionais funcionando
- ✅ Tabela settings populada
- ✅ Policies de RLS configuradas
- ⚠️ Auth cleanup manual (por design)

## Próximos Passos Recomendados
1. Adicionar confirmação visual de exclusão (toast/alert)
2. Implementar soft delete (marcar como inativo ao invés de deletar)
3. Configurar Edge Function deployment para produção
4. Adicionar logs de auditoria
