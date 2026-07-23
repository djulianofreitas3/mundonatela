
-- 1. Enum types
CREATE TYPE public.device_status AS ENUM ('pending', 'active', 'expired', 'blocked', 'revoked');

-- 2. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  observacao TEXT,
  status TEXT DEFAULT 'ativo',
  vencimento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. listas_iptv (senhas serão protegidas no frontend)
CREATE TABLE public.listas_iptv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  usuario TEXT NOT NULL,
  senha TEXT NOT NULL,
  status TEXT DEFAULT 'ativo',
  vencimento TIMESTAMPTZ,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. dispositivos
CREATE TABLE public.dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id TEXT UNIQUE NOT NULL,
  device_name TEXT,
  android_version TEXT,
  app_version TEXT,
  device_token UUID DEFAULT gen_random_uuid() UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  status public.device_status DEFAULT 'pending',
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. codigos_ativacao (uso único, 15 min expiração)
CREATE TABLE public.codigos_ativacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL REFERENCES public.dispositivos(installation_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. dispositivo_lista (vínculo N:N se necessário, mas o requisito foca em vincular lista ao dispositivo)
CREATE TABLE public.dispositivo_lista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id UUID REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  lista_id UUID REFERENCES public.listas_iptv(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dispositivo_id, lista_id)
);

-- 8. historico_ativacoes
CREATE TABLE public.historico_ativacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id UUID REFERENCES public.dispositivos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  lista_id UUID REFERENCES public.listas_iptv(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'activation', 'renewal', 'block', 'unblock'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_dispositivos_installation_id ON public.dispositivos(installation_id);
CREATE INDEX idx_codigos_ativacao_code ON public.codigos_ativacao(code);
CREATE INDEX idx_dispositivos_device_token ON public.dispositivos(device_token);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listas_iptv TO authenticated;
GRANT ALL ON public.listas_iptv TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispositivos TO authenticated;
GRANT ALL ON public.dispositivos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.codigos_ativacao TO authenticated;
GRANT ALL ON public.codigos_ativacao TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispositivo_lista TO authenticated;
GRANT ALL ON public.dispositivo_lista TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_ativacoes TO authenticated;
GRANT ALL ON public.historico_ativacoes TO service_role;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_iptv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_ativacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivo_lista ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_ativacoes ENABLE ROW LEVEL SECURITY;

-- Simple Policies (assuming only authenticated admins manage these for now)
-- You mentioned "Administradores" screen, so we might need a role check later.
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage clientes" ON public.clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage listas_iptv" ON public.listas_iptv FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage dispositivos" ON public.dispositivos FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage codigos_ativacao" ON public.codigos_ativacao FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage dispositivo_lista" ON public.dispositivo_lista FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage historico_ativacoes" ON public.historico_ativacoes FOR ALL TO authenticated USING (true);

-- Public access policies for Edge Functions (handled via service_role typically, but good to have)
-- If we want the Edge Function to use the user's token, we'd need different policies.
-- Given we'll use a service_role client in the Edge Functions for some operations, RLS is bypassed there.
