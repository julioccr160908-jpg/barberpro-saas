OrgContext: No user, clearing org.
3VM13:63 OrgContext: Refreshing for user e33a1023-f7c3-47b6-a4b5-434579989757
3VM13:63 OrgContext: User owns org barbearia2
evolution.barberhost.com.br/instance/connectionState/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connectionState/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connectionState/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
evolution.barberhost.com.br/instance/connect/barbearia2-whatsapp:1  Failed to load resource: the server responded with a status of 404 ()-- Add WhatsApp multi-tenancy columns to organizations
-- Each barbershop gets its own Evolution API instance
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS whatsapp_instance_name text,
  ADD COLUMN IF NOT EXISTS whatsapp_connected boolean DEFAULT false;

COMMENT ON COLUMN public.organizations.whatsapp_instance_name IS 'Nome da instância no Evolution API (ex: barbearia-1-whatsapp)';
COMMENT ON COLUMN public.organizations.whatsapp_connected IS 'Flag indicando se a instância WhatsApp está conectada a um número';
