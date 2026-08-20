-- Create support_requests table
CREATE TABLE public.support_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    request_type text NOT NULL CHECK (request_type IN ('content_request', 'problem_report')),
    category text NOT NULL,
    title text,
    description text,
    content_name text,
    year text,
    season text,
    city_state text,
    device_id text,
    installation_id text,
    device_name text,
    device_manufacturer text,
    device_model text,
    device_type text,
    android_version text,
    app_version text,
    version_code integer,
    status text DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'completed', 'added', 'unavailable')),
    admin_note text
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can do everything
CREATE POLICY "Admins can do everything on support_requests" 
ON public.support_requests 
FOR ALL 
TO authenticated 
USING (true);

-- Public/App can only insert
-- In a real scenario, we would validate if the installation_id exists in dispositivos
CREATE POLICY "Public/App can insert support_requests" 
ON public.support_requests 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert some test records
INSERT INTO public.support_requests (request_type, category, content_name, device_name, app_version, status, title)
VALUES 
('content_request', 'movie', 'Gladiador 2', 'Mi Box', '2.5.13', 'new', 'Pedido de Filme'),
('problem_report', 'player', NULL, 'Philips TV', '2.5.13', 'new', 'Filme fecha ao reproduzir');
