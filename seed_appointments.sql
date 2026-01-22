
DO $$
DECLARE
  r_client RECORD;
  v_barber_id UUID;
  v_service_id UUID;
BEGIN
  -- 1. Pega um barbeiro existente
  SELECT id INTO v_barber_id FROM public.profiles WHERE role = 'BARBER' LIMIT 1;
  -- Se não achar barbeiro, tenta pegar qualquer perfil (admin)
  IF v_barber_id IS NULL THEN
     SELECT id INTO v_barber_id FROM public.profiles WHERE role = 'ADMIN' LIMIT 1;
  END IF;

  -- 2. Pega um serviço existente
  SELECT id INTO v_service_id FROM public.services LIMIT 1;

  IF v_barber_id IS NOT NULL AND v_service_id IS NOT NULL THEN
      -- 3. Itera sobre clientes de teste criados anteriormente
      FOR r_client IN 
        SELECT id FROM public.profiles WHERE email LIKE 'cliente_teste_%'
      LOOP
        
        -- A) Agendamento PASSADO (COMPLETED)
        -- Data: entre 1 e 30 dias atrás
        INSERT INTO public.appointments (
            barber_id, 
            customer_id, 
            service_id, 
            date, 
            status
        ) VALUES (
            v_barber_id,
            r_client.id,
            v_service_id,
            NOW() - (trunc(random() * 20 + 1) || ' days')::interval + '14:00:00',
            'COMPLETED'
        );

        -- B) Agendamento HOJE (CONFIRMED)
        -- Data: Hoje em horario aleatorio para evitar colisoes visuais exatas
        -- Usando loop time offset simples ou random
        INSERT INTO public.appointments (
            barber_id, 
            customer_id, 
            service_id, 
            date, 
            status
        ) VALUES (
            v_barber_id,
            r_client.id,
            v_service_id,
            (CURRENT_DATE + '09:00:00'::time) + (trunc(random() * 600) || ' minutes')::interval,
            'CONFIRMED'
        );

        -- C) Agendamento FUTURO (PENDING ou CONFIRMED)
        INSERT INTO public.appointments (
            barber_id, 
            customer_id, 
            service_id, 
            date, 
            status
        ) VALUES (
            v_barber_id,
            r_client.id,
            v_service_id,
            NOW() + (trunc(random() * 15 + 1) || ' days')::interval + '10:00:00',
            'PENDING'
        );

      END LOOP;
  ELSE
    RAISE NOTICE 'Nao foi possivel encontrar Barbeiro ou Servico para criar agendamentos.';
  END IF;
END $$;
