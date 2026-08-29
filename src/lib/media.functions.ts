import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BATCH_SIZE = 300;

/** Lists the registered Xtream sources (only safe fields). */
export const getMediaSources = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("listas_iptv")
    .select("id, nome, status")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

const listFilter = z.object({ lista_id: z.string().uuid().optional() });

/** Aggregated trailer counters for the selected source (or all sources). */
export const getMediaStats = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => listFilter.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("media_source_items")
      .select("media_catalog_id, media_type, catalog:media_catalog(trailer_status, youtube_trailer_id)");
    if (data.lista_id) query = query.eq("lista_id", data.lista_id);

    const { data: rows, error } = await query;
    if (error) throw error;

    const items = rows ?? [];
    const withTrailer = items.filter((row: any) => Boolean(row.catalog?.youtube_trailer_id)).length;
    const review = items.filter((row: any) => row.catalog?.trailer_status === "review").length;

    return {
      total: items.length,
      movies: items.filter((row: any) => row.media_type === "movie").length,
      series: items.filter((row: any) => row.media_type === "series").length,
      with_trailer: withTrailer,
      without_trailer: items.length - withTrailer,
      review,
    };
  });

const itemsFilter = z.object({
  lista_id: z.string().uuid().optional(),
  search: z.string().optional(),
  filter: z.enum(["all", "with_trailer", "without_trailer", "review"]).default("all"),
  limit: z.number().int().min(1).max(200).default(100),
});

/** Paginated catalog rows for the Trailers page. */
export const getMediaItems = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => itemsFilter.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("media_source_items")
      .select(
        `id, stream_id, media_type, original_name, year, lista_id,
         lista:listas_iptv(nome),
         catalog:media_catalog(id, title, year, media_type, youtube_trailer_id, trailer_url, poster_url, backdrop_url, trailer_status, last_checked_at)`,
      )
      .order("original_name", { ascending: true })
      .limit(data.limit);

    if (data.lista_id) query = query.eq("lista_id", data.lista_id);
    if (data.search) query = query.ilike("original_name", `%${data.search}%`);

    const { data: rows, error } = await query;
    if (error) throw error;

    const items = rows ?? [];
    if (data.filter === "with_trailer") {
      return items.filter((row: any) => Boolean(row.catalog?.youtube_trailer_id));
    }
    if (data.filter === "without_trailer") {
      return items.filter((row: any) => !row.catalog?.youtube_trailer_id);
    }
    if (data.filter === "review") {
      return items.filter((row: any) => row.catalog?.trailer_status === "review");
    }
    return items;
  });

/** Manually sets or replaces the trailer of a catalog entry. */
export const updateCatalogTrailer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        media_catalog_id: z.string().uuid(),
        youtube_input: z.string().optional(),
        trailer_status: z.enum(["pending", "found", "not_found", "manual", "review"]).optional(),
        poster_url: z.string().url().optional().or(z.literal("")),
        backdrop_url: z.string().url().optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { parseYoutubeId, youtubeUrl } = await import("./media.server");

    const updates: Record<string, unknown> = {
      last_checked_at: new Date().toISOString(),
    };

    if (data.youtube_input !== undefined) {
      const trimmed = data.youtube_input.trim();
      if (!trimmed) {
        updates["youtube_trailer_id"] = null;
        updates["trailer_url"] = null;
        updates["trailer_status"] = data.trailer_status ?? "pending";
      } else {
        const videoId = parseYoutubeId(trimmed);
        if (!videoId) throw new Error("ID ou URL do YouTube inválido.");
        updates["youtube_trailer_id"] = videoId;
        updates["trailer_url"] = youtubeUrl(videoId);
        updates["trailer_status"] = data.trailer_status ?? "manual";
      }
    } else if (data.trailer_status) {
      updates["trailer_status"] = data.trailer_status;
    }

    if (data.poster_url !== undefined) updates["poster_url"] = data.poster_url || null;
    if (data.backdrop_url !== undefined) updates["backdrop_url"] = data.backdrop_url || null;

    const { data: updated, error } = await supabaseAdmin
      .from("media_catalog")
      .update(updates)
      .eq("id", data.media_catalog_id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

/** Creates (or reuses) a background sync job for a source. */
export const startCatalogSync = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ lista_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("media_sync_jobs")
      .select("*")
      .eq("lista_id", data.lista_id)
      .in("status", ["queued", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing;

    const { data: job, error } = await supabaseAdmin
      .from("media_sync_jobs")
      .insert([{ lista_id: data.lista_id, status: "queued" }])
      .select()
      .single();

    if (error) throw error;
    return job;
  });

/** Current job state for the selected source. */
export const getSyncJob = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ lista_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job, error } = await supabaseAdmin
      .from("media_sync_jobs")
      .select("*")
      .eq("lista_id", data.lista_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return job;
  });

/**
 * Processes ONE batch of a sync job and returns the updated job.
 * The panel calls this repeatedly, so the UI never blocks on a full catalog.
 */
export const runCatalogSyncBatch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ job_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchXtreamCatalog } = await import("./media.server");

    const { data: job, error: jobError } = await supabaseAdmin
      .from("media_sync_jobs")
      .select("*")
      .eq("id", data.job_id)
      .single();
    if (jobError || !job) throw new Error("Job de sincronização não encontrado.");
    if (job.status === "completed" || job.status === "failed") return job;

    const { data: lista, error: listaError } = await supabaseAdmin
      .from("listas_iptv")
      .select("id, url, usuario, senha")
      .eq("id", job.lista_id)
      .single();
    if (listaError || !lista) throw new Error("Lista de origem não encontrada.");

    try {
      const catalog = await fetchXtreamCatalog(lista.url, lista.usuario, lista.senha);
      const slice = catalog.slice(job.cursor_offset, job.cursor_offset + BATCH_SIZE);

      if (slice.length > 0) {
        // 1. Resolve existing central entries for this batch.
        const titles = Array.from(new Set(slice.map((item) => item.normalized_title)));
        const { data: existing } = await supabaseAdmin
          .from("media_catalog")
          .select("id, normalized_title, year, media_type")
          .in("normalized_title", titles);

        const keyOf = (title: string, year: number | null, type: string) =>
          `${title}::${year ?? "-"}::${type}`;
        const index = new Map<string, string>();
        for (const row of existing ?? []) {
          index.set(keyOf(row.normalized_title, row.year, row.media_type), row.id);
        }

        // 2. Create only the missing central entries (never duplicate).
        const toCreate: Record<string, unknown>[] = [];
        const seen = new Set<string>();
        for (const item of slice) {
          const key = keyOf(item.normalized_title, item.year, item.media_type);
          if (index.has(key) || seen.has(key)) continue;
          seen.add(key);
          toCreate.push({
            title: item.original_name,
            normalized_title: item.normalized_title,
            year: item.year,
            media_type: item.media_type,
            trailer_status: "pending",
          });
        }

        if (toCreate.length > 0) {
          const { data: created, error: createError } = await supabaseAdmin
            .from("media_catalog")
            .upsert(toCreate, { onConflict: "normalized_title,year,media_type", ignoreDuplicates: true })
            .select("id, normalized_title, year, media_type");
          if (createError) throw createError;
          for (const row of created ?? []) {
            index.set(keyOf(row.normalized_title, row.year, row.media_type), row.id);
          }

          // Re-read anything the upsert skipped due to a concurrent insert.
          const missing = toCreate
            .map((row) => row["normalized_title"] as string)
            .filter((title) => !Array.from(index.keys()).some((key) => key.startsWith(`${title}::`)));
          if (missing.length > 0) {
            const { data: refetched } = await supabaseAdmin
              .from("media_catalog")
              .select("id, normalized_title, year, media_type")
              .in("normalized_title", missing);
            for (const row of refetched ?? []) {
              index.set(keyOf(row.normalized_title, row.year, row.media_type), row.id);
            }
          }
        }

        // 3. Link this source's stream ids to the central entries.
        const sourceRows = slice.map((item) => ({
          lista_id: lista.id,
          stream_id: item.stream_id,
          media_type: item.media_type,
          original_name: item.original_name,
          normalized_title: item.normalized_title,
          year: item.year,
          media_catalog_id: index.get(keyOf(item.normalized_title, item.year, item.media_type)) ?? null,
        }));

        const { error: linkError } = await supabaseAdmin
          .from("media_source_items")
          .upsert(sourceRows, { onConflict: "lista_id,media_type,stream_id" });
        if (linkError) throw linkError;
      }

      const nextOffset = job.cursor_offset + slice.length;
      const done = nextOffset >= catalog.length || slice.length === 0;

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("media_sync_jobs")
        .update({
          status: done ? "completed" : "running",
          cursor_offset: nextOffset,
          processed_count: nextOffset,
          total_count: catalog.length,
          started_at: job.started_at ?? new Date().toISOString(),
          finished_at: done ? new Date().toISOString() : null,
          error_message: null,
        })
        .eq("id", job.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    } catch (error: any) {
      const { data: failed } = await supabaseAdmin
        .from("media_sync_jobs")
        .update({
          status: "failed",
          error_message: String(error?.message ?? error),
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .select()
        .single();
      return failed;
    }
  });
