-- Script para marcar agendamentos como COMPLETED (para testes de receita)

-- 1. MARCAR TODOS OS AGENDAMENTOS COMO COMPLETED
-- Use isso para testar a receita no dashboard
UPDATE appointments 
SET status = 'COMPLETED' 
WHERE status != 'CANCELLED';

-- 2. Verificar agendamentos após a atualização
SELECT 
  a.id,
  TO_CHAR(a.date, 'DD/MM/YYYY HH24:MI') as data_hora,
  a.status,
  s.name as servico,
  s.price as valor,
  p.name as cliente
FROM appointments a
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN profiles p ON a.customer_id = p.id
ORDER BY a.date;

-- 3. CRIAR AGENDAMENTO COMPLETED DE TESTE (opcional)
-- Cria um agendamento concluído de hoje
INSERT INTO appointments (
  barber_id,
  customer_id,
  service_id,
  date,
  status,
  notes
) VALUES (
  (SELECT id FROM profiles WHERE role = 'BARBER' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'CUSTOMER' LIMIT 1),
  (SELECT id FROM services LIMIT 1),
  NOW() - INTERVAL '2 hours', -- 2 horas atrás
  'COMPLETED',
  'Teste de receita realizada'
);

-- 4. RESETAR TODOS PARA PENDING (se quiser voltar ao estado inicial)
-- UPDATE appointments 
-- SET status = 'PENDING' 
-- WHERE status = 'COMPLETED';
