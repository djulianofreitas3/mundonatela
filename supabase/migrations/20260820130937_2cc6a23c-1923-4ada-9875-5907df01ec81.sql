-- Tabela de Solicitações e Suporte
CREATE TABLE IF NOT EXISTS public.support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    request_type TEXT NOT NULL CHECK (request_type IN ('content_request', 'problem_report')),
    category TEXT NOT NULL,
    title TEXT,
    description TEXT,
    content_name TEXT,
    year TEXT,
    season TEXT,
    city_state TEXT,
    device_id TEXT,
    installation_id TEXT,
    device_name TEXT,
    device_manufacturer TEXT,
    device_model TEXT,
    device_type TEXT,
    android_version TEXT,
    app_version TEXT,
    version_code INTEGER,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'completed', 'added', 'unavailable')),
    admin_note TEXT
);

-- Habilitar RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Permissões (Grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;
GRANT INSERT ON public.support_requests TO anon;

-- Policies
CREATE POLICY "Admins podem ver tudo" ON public.support_requests
    FOR ALL TO authenticated USING (true);

CREATE POLICY "App pode enviar solicitações" ON public.support_requests
    FOR INSERT TO anon WITH CHECK (true);

-- Habilitar Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- Criar alguns registros de teste
INSERT INTO public.support_requests (request_type, category, content_name, device_name, status, app_version)
VALUES 
('content_request', 'movie', 'Gladiador 2', 'Mi Box S', 'new', '2.5.13'),
('problem_report', 'player', 'Trava no início', 'Samsung TV', 'new', '2.5.13'),
('content_request', 'series', 'Stranger Things S5', 'Fire Stick', 'in_review', '2.5.10');
