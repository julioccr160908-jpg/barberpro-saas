# Operações Seguras do Banco de Dados

Este documento guia você sobre como manter, salvar e recuperar seus dados do sistema BarberPro SaaS.

## 1. Backup Automático (Recomendado)
Para criar uma cópia de segurança de todos os seus dados atuais (Usuários, Agendamentos, Perfis, etc):

1. Abra o terminal na pasta do projeto.
2. Execute o script de backup:
   ```powershell
   ./backup_db.ps1
   ```
3. O arquivo será salvo na pasta `backups/` com a data e hora atual.

## 2. Restaurar um Backup
Caso perca dados ou queira voltar a um estado anterior:

1. Execute o script de restauração:
   ```powershell
   ./restore_db.ps1
   ```
2. O script listará todos os backups disponíveis.
3. Digite o número correspondente ao backup que deseja usar.
4. Confirme com `y`.

## 3. Reiniciando o Supabase com Segurança
O Docker/Supabase pode perder dados se os volumes forem destruídos. Para evitar isso:

- **Para PARAR o sistema**:
  Use `npx supabase stop`. (Isso salva o estado atual).
  **NUNCA** use `npx supabase stop --no-backup` a menos que você queira *perder* os dados intencionalmente.

- **Para REINICIAR (se travar)**:
  Tente primeiro apenas `npx supabase stop` seguido de `npx supabase start`.

- **Se precisar resetar tudo (Seed)**:
  Configuramos o sistema para recriar os dados de teste automaticamente se você rodar:
  ```bash
  npx supabase db reset
  ```
  Isso apagará tudo e recriará os usuários padrão (Julio, Admin, Barbeiro).

## 4. Onde estão meus dados?
Seus dados vivem em "Volumes Docker". Eles persistem mesmo se você desligar o computador, contanto que você não delete os volumes ou use comandos destrutivos.
