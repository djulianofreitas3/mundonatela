-- 1. Adicionar o status 'removed' ao enum de status se ele existir como tipo
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_status') THEN
        ALTER TYPE public.app_status ADD VALUE IF NOT EXISTS 'removed';
    END IF;
END $$;

-- 2. Adicionar colunas de auditoria de remoção na tabela dispositivos
ALTER TABLE public.dispositivos 
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES auth.users(id);

-- 3. Se o status for um CHECK constraint em vez de ENUM, atualizar a constraint
-- (Baseado no erro TS, parece ser um ENUM ou similar no PostgREST)
-- Mas para garantir no banco:
DO $$
BEGIN
    -- Se for um check constraint chamado 'dispositivos_status_check'
    IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'dispositivos' AND constraint_name = 'dispositivos_status_check') THEN
        ALTER TABLE public.dispositivos DROP CONSTRAINT dispositivos_status_check;
        ALTER TABLE public.dispositivos ADD CONSTRAINT dispositivos_status_check CHECK (status IN ('pending', 'active', 'expired', 'blocked', 'revoked', 'removed'));
    END IF;
END $$;