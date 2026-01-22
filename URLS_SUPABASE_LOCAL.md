# 🔗 URLs e Credenciais do Supabase Local

## 📊 Database (PostgreSQL)

### **Database URL (Connection String)**
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### **Componentes da URL**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

| Componente | Valor |
|------------|-------|
| **Protocolo** | `postgresql://` |
| **Usuário** | `postgres` |
| **Senha** | `postgres` |
| **Host** | `127.0.0.1` ou `localhost` |
| **Porta** | `54322` |
| **Database** | `postgres` |

---

## 🌐 APIs e Serviços Supabase Local

### **API URL (REST)**
```
http://127.0.0.1:54321
```

### **API URL Completa (com autenticação)**
```
http://127.0.0.1:54321/rest/v1/
```

### **GraphQL URL**
```
http://127.0.0.1:54321/graphql/v1
```

### **Studio (Interface Visual)**
```
http://127.0.0.1:54323
```
🎨 Interface web para gerenciar o banco de dados

### **Inbucket (Email Testing)**
```
http://127.0.0.1:54324
```
📧 Visualizar emails enviados pelo Supabase

---

## 🔑 Credenciais e Chaves

### **Service Role Key** (Admin - NUNCA exponha!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### **Anon Key** (Pública - pode expor)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

---

## 🐳 Docker Containers

### **Database Container**
```bash
# Acessar via Docker
docker exec -it supabase_db_barberpro-saas psql -U postgres -d postgres

# Executar SQL
docker exec supabase_db_barberpro-saas psql -U postgres -d postgres -c "SELECT * FROM profiles;"
```

### **Lista de Containers**
```bash
docker ps --filter "name=supabase_*_barberpro-saas"
```

---

## 🛠️ Ferramentas de Conexão

### **Via psql (Terminal)**
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### **Via DBeaver / pgAdmin**
```
Host: localhost
Port: 54322
Database: postgres
Username: postgres
Password: postgres
```

### **Via Node.js (pg)**
```javascript
const { Client } = require('pg');
const client = new Client({
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});
```

### **Via Supabase JS Client**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);
```

---

## 📈 Monitoramento

### **Verificar Status**
```bash
npx supabase status
```

### **Ver Logs**
```bash
# Logs do Database
docker logs supabase_db_barberpro-saas

# Logs do API Gateway
docker logs supabase_kong_barberpro-saas
```

---

## 🔒 Volumes de Dados

### **Localização dos Dados**
Os dados persistem nos Docker volumes:
```bash
# Listar volumes
docker volume ls --filter label=com.supabase.cli.project=barberpro-saas

# Verificar tamanho
docker volume inspect supabase_db_barberpro-saas
```

### **Backup Manual**
```bash
# Dump do banco
docker exec supabase_db_barberpro-saas pg_dump -U postgres postgres > backup.sql

# Restaurar
cat backup.sql | docker exec -i supabase_db_barberpro-saas psql -U postgres -d postgres
```

---

## ⚠️ IMPORTANTE

### **Ambiente Local vs Produção**

| Ambiente | Database URL | API URL |
|----------|-------------|---------|
| **Local** | `127.0.0.1:54322` | `http://127.0.0.1:54321` |
| **Produção** | `db.xxx.supabase.co` | `https://xxx.supabase.co` |

### **Nunca exponha em produção:**
- ❌ Service Role Key
- ❌ Database senha em plain text
- ❌ Portas locais (54321, 54322)

---

## 📝 Arquivo .env.local

Seu arquivo `.env.local` deve conter:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

---

## 🚀 Quick Reference

### **Acessar Database diretamente**
```bash
docker exec -it supabase_db_barberpro-saas psql -U postgres
```

### **Executar query rápida**
```bash
docker exec supabase_db_barberpro-saas psql -U postgres -d postgres -c "SELECT email FROM profiles;"
```

### **Acessar Studio Visual**
```
http://localhost:54323
```
Usuário e senha não necessários para ambiente local.

---

**Última atualização**: 2025-12-11
