ALTER TABLE public.codigos_ativacao ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.dispositivos ALTER COLUMN expires_at DROP NOT NULL;
UPDATE public.codigos_ativacao SET expires_at = NULL WHERE used_at IS NULL;
UPDATE public.dispositivos SET expires_at = NULL WHERE status = 'active';