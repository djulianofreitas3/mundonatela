ALTER TABLE public.codigos_ativacao 
ADD COLUMN IF NOT EXISTS poll_token UUID DEFAULT gen_random_uuid();

ALTER TABLE public.codigos_ativacao 
ADD COLUMN IF NOT EXISTS request_id UUID DEFAULT gen_random_uuid();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.codigos_ativacao TO authenticated;
GRANT ALL ON public.codigos_ativacao TO service_role;