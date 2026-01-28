-- Inserir dados iniciais na tabela settings se não existirem
INSERT INTO settings (id, interval_minutes, schedule) 
SELECT 
  1,
  45,
  json_build_array(
    json_build_object('dayId', 0, 'isOpen', false, 'openTime', '09:00', 'closeTime', '18:00'),
    json_build_object('dayId', 1, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'),
    json_build_object('dayId', 2, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'),
    json_build_object('dayId', 3, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'),
    json_build_object('dayId', 4, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'),
    json_build_object('dayId', 5, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'),
    json_build_object('dayId', 6, 'isOpen', true, 'openTime', '09:00', 'closeTime', '17:00')
  )::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
