-- SERVIÇOS PADRÃO
INSERT INTO public.services (name, price, duration_minutes, description)
VALUES 
('Corte de Cabelo', 35.00, 30, 'Corte tradicional ou moderno com acabamento e lavagem.'),
('Barba', 25.00, 30, 'Barba modelada com toalha quente e balm.'),
('Combo (Corte + Barba)', 55.00, 50, 'Pacote completo de corte e barba com desconto.', 'combo'),
('Pezinho / Acabamento', 15.00, 15, 'Apenas o acabamento e contorno.', 'cabelo'),
('Sobrancelha', 10.00, 10, 'Design de sobrancelha na navalha ou pinça.', 'facial');

-- CONFIGURAÇÕES DA BARBEARIA (Horários)
-- Remove settings anteriores para evitar duplicidade
DELETE FROM public.settings WHERE id = 1;

INSERT INTO public.settings (
  id, 
  interval_minutes, 
  schedule,
  establishment_name,
  address,
  phone,
  city,
  state,
  zip_code
) VALUES (
  1,
  30, -- Intervalo de 30 min
  json_build_array(
    json_build_object('dayId', 0, 'isOpen', false, 'openTime', '09:00', 'closeTime', '18:00'), -- Dom (Fechado)
    json_build_object('dayId', 1, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Seg
    json_build_object('dayId', 2, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Ter
    json_build_object('dayId', 3, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Qua
    json_build_object('dayId', 4, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Qui
    json_build_object('dayId', 5, 'isOpen', true, 'openTime', '09:00', 'closeTime', '20:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Sex
    json_build_object('dayId', 6, 'isOpen', true, 'openTime', '08:00', 'closeTime', '18:00', 'breakStart', '12:00', 'breakEnd', '12:30')  -- Sab
  )::jsonb,
  'BarberHost',
  'Rua Exemplo, 123 - Centro',
  '(11) 99999-9999',
  'Cidade Exemplo',
  'SP',
  '00000-000'
);
