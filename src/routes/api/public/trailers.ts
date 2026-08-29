import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const bodySchema = z.object({
  lista_id: z.string().uuid().optional(),
  stream_ids: z.array(z.union([z.string(), z.number()])).max(200).optional(),
  items: z
    .array(
      z.object({
        lista_id: z.string().uuid(),
        stream_id: z.union([z.string(), z.number()]),
        media_type: z.enum(["movie", "series"]).optional(),
      }),
    )
    .max(200)
    .optional(),
});

export const Route = createFileRoute("/api/public/trailers")({
  component: () => null,
  loader: () => {
    throw new Error("This is a server-only API route");
  },
});

// @ts-ignore - server handlers attached to the generated route options
Route.options.server = {
  handlers: {
    OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
    POST: async ({ request }: { request: Request }) => {
      try {
        const raw = await request.json().catch(() => null);
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            { success: false, error: "invalid_body", message: "Envie lista_id + stream_ids ou items[]." },
            { status: 400, headers: corsHeaders },
          );
        }

        // Normalize both accepted shapes into a single list of (lista_id, stream_id).
        const requested: { lista_id: string; stream_id: string }[] = [];
        if (parsed.data.items?.length) {
          for (const item of parsed.data.items) {
            requested.push({ lista_id: item.lista_id, stream_id: String(item.stream_id) });
          }
        } else if (parsed.data.lista_id && parsed.data.stream_ids?.length) {
          for (const streamId of parsed.data.stream_ids) {
            requested.push({ lista_id: parsed.data.lista_id, stream_id: String(streamId) });
          }
        }

        if (requested.length === 0) {
          return Response.json({ success: true, data: [] }, { status: 200, headers: corsHeaders });
        }

        const listIds = Array.from(new Set(requested.map((item) => item.lista_id)));
        const streamIds = Array.from(new Set(requested.map((item) => item.stream_id)));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("media_source_items")
          .select(
            "lista_id, stream_id, media_type, catalog:media_catalog(youtube_trailer_id, trailer_url, poster_url, backdrop_url, overview, trailer_status)",
          )
          .in("lista_id", listIds)
          .in("stream_id", streamIds);

        if (error) {
          return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
        }

        const wanted = new Set(requested.map((item) => `${item.lista_id}::${item.stream_id}`));
        const payload = (data ?? [])
          .filter((row: any) => wanted.has(`${row.lista_id}::${row.stream_id}`))
          .map((row: any) => ({
            lista_id: row.lista_id,
            stream_id: row.stream_id,
            media_type: row.media_type,
            youtube_trailer_id: row.catalog?.youtube_trailer_id ?? null,
            trailer_url: row.catalog?.trailer_url ?? null,
            poster_url: row.catalog?.poster_url ?? null,
            backdrop_url: row.catalog?.backdrop_url ?? null,
            overview: row.catalog?.overview ?? null,
            trailer_status: row.catalog?.trailer_status ?? "pending",
          }));

        return Response.json(
          { success: true, count: payload.length, data: payload },
          {
            status: 200,
            headers: {
              ...corsHeaders,
              // Preview metadata changes rarely: allow client/CDN caching.
              "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
            },
          },
        );
      } catch (error: any) {
        return Response.json(
          { success: false, error: "internal_error", message: String(error?.message ?? error) },
          { status: 500, headers: corsHeaders },
        );
      }
    },
  },
};
