-- Media catalog: central library
CREATE TABLE public.media_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  normalized_title text NOT NULL,
  year integer,
  media_type text NOT NULL CHECK (media_type IN ('movie','series')),
  tmdb_id text,
  imdb_id text,
  youtube_trailer_id text,
  trailer_url text,
  poster_url text,
  backdrop_url text,
  overview text,
  trailer_status text NOT NULL DEFAULT 'pending' CHECK (trailer_status IN ('pending','found','not_found','manual','review')),
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX media_catalog_unique_key
  ON public.media_catalog (normalized_title, COALESCE(year, -1), media_type);
CREATE INDEX media_catalog_trailer_status_idx ON public.media_catalog (trailer_status);
CREATE INDEX media_catalog_title_idx ON public.media_catalog (normalized_title);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_catalog TO authenticated;
GRANT ALL ON public.media_catalog TO service_role;
ALTER TABLE public.media_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage media_catalog" ON public.media_catalog
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.media_catalog
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Source items: per-list mapping
CREATE TABLE public.media_source_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id uuid NOT NULL REFERENCES public.listas_iptv(id) ON DELETE CASCADE,
  stream_id text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie','series')),
  original_name text NOT NULL,
  normalized_title text NOT NULL,
  year integer,
  media_catalog_id uuid REFERENCES public.media_catalog(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX media_source_items_unique_stream
  ON public.media_source_items (lista_id, media_type, stream_id);
CREATE INDEX media_source_items_lista_idx ON public.media_source_items (lista_id);
CREATE INDEX media_source_items_catalog_idx ON public.media_source_items (media_catalog_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_source_items TO authenticated;
GRANT ALL ON public.media_source_items TO service_role;
ALTER TABLE public.media_source_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage media_source_items" ON public.media_source_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.media_source_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Background sync jobs
CREATE TABLE public.media_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id uuid NOT NULL REFERENCES public.listas_iptv(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  cursor_offset integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_sync_jobs_lista_idx ON public.media_sync_jobs (lista_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_sync_jobs TO authenticated;
GRANT ALL ON public.media_sync_jobs TO service_role;
ALTER TABLE public.media_sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage media_sync_jobs" ON public.media_sync_jobs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.media_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();