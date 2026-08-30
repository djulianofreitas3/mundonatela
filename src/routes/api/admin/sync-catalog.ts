import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

type XtreamMovie = {
  stream_id?: number | string;
  name?: string;
  title?: string;
  releaseDate?: string;
  release_date?: string;
  year?: string | number;
  stream_icon?: string;
};

type CatalogRow = {
  id: string;
  normalized_title: string;
  year: number | null;
};

function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\(\d{4}\)/g, "")
    .replace(/\[\d{4}\]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractYear(item: XtreamMovie): number | null {
  const directYear = Number(item.year);

  if (
    Number.isInteger(directYear) &&
    directYear >= 1900 &&
    directYear <= 2100
  ) {
    return directYear;
  }

  const candidates = [
    item.releaseDate,
    item.release_date,
    item.name,
    item.title,
  ].filter(Boolean) as string[];

  for (const value of candidates) {
    const match = value.match(/\b(19|20)\d{2}\b/);
    if (match) return Number(match[0]);
  }

  return null;
}

function catalogKey(normalizedTitle: string, year: number | null) {
  return `${normalizedTitle}|||${year ?? "null"}`;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export const Route = createFileRoute("/api/admin/sync-catalog")({
  component: () => null,
  loader: () => {
    throw new Error("This is a server-only API route");
  },
});

// @ts-ignore
Route.options.server = {
  handlers: {
    POST: async ({ request }: { request: Request }) => {
      const startedAt = Date.now();

      try {
        console.log("[sync-catalog] Iniciando sincronização...");

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const body = await request.json();

        const schema = z.object({
          lista_id: z.string().uuid(),
          limit: z.number().int().positive().max(50000).optional(),
          xtream_timeout_ms: z
            .number()
            .int()
            .min(5000)
            .max(180000)
            .optional(),
        });

        const parsed = schema.safeParse(body);

        if (!parsed.success) {
          return Response.json(
            {
              error: "Invalid input",
              details: parsed.error.format(),
            },
            { status: 400 },
          );
        }

        const {
          lista_id,
          limit,
          xtream_timeout_ms = 60000,
        } = parsed.data;

        console.log(`[sync-catalog] Buscando lista ${lista_id} no Supabase...`);

        const { data: lista, error: listaError } = await supabaseAdmin
          .from("listas_iptv")
          .select("id, nome, url, usuario, senha, status")
          .eq("id", lista_id)
          .single();

        if (listaError || !lista) {
          console.error("[sync-catalog] Lista não encontrada:", listaError);

          return Response.json(
            { error: "Lista não encontrada" },
            { status: 404 },
          );
        }

        if (lista.status !== "ativo") {
          console.warn("[sync-catalog] Lista está inativa.");

          return Response.json(
            { error: "A lista está inativa" },
            { status: 400 },
          );
        }

        console.log(
          `[sync-catalog] Lista encontrada: ${lista.nome}. Consultando servidor Xtream...`,
        );

        const baseUrl = lista.url.replace(/\/+$/, "");

        const apiUrl =
          `${baseUrl}/player_api.php` +
          `?username=${encodeURIComponent(lista.usuario)}` +
          `&password=${encodeURIComponent(lista.senha)}` +
          `&action=get_vod_streams`;

        const xtreamStartedAt = Date.now();

        let xtreamResponse: Response;

        try {
          xtreamResponse = await fetchWithTimeout(
            apiUrl,
            xtream_timeout_ms,
          );
        } catch (error) {
          const elapsed = Date.now() - xtreamStartedAt;

          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            console.error(
              `[sync-catalog] Timeout do Xtream após ${elapsed} ms.`,
            );

            return Response.json(
              {
                error: "Servidor Xtream demorou demais para responder",
                etapa: "xtream_fetch",
                timeout_ms: xtream_timeout_ms,
                elapsed_ms: elapsed,
              },
              { status: 504 },
            );
          }

          throw error;
        }

        const xtreamElapsed = Date.now() - xtreamStartedAt;

        console.log(
          `[sync-catalog] Xtream respondeu em ${xtreamElapsed} ms com status ${xtreamResponse.status}.`,
        );

        if (!xtreamResponse.ok) {
          return Response.json(
            {
              error: "Falha ao consultar catálogo da lista",
              status: xtreamResponse.status,
              etapa: "xtream_fetch",
            },
            { status: 502 },
          );
        }

        console.log("[sync-catalog] Lendo JSON do catálogo...");

        const rawMovies = (await xtreamResponse.json()) as XtreamMovie[];

        if (!Array.isArray(rawMovies)) {
          console.error(
            "[sync-catalog] Resposta inválida: o payload não é um array.",
          );

          return Response.json(
            {
              error: "Resposta inválida recebida da lista",
              etapa: "xtream_parse",
            },
            { status: 502 },
          );
        }

        console.log(
          `[sync-catalog] Catálogo recebido: ${rawMovies.length} filmes.`,
        );

        const selectedMovies = limit ? rawMovies.slice(0, limit) : rawMovies;

        console.log(
          `[sync-catalog] Processando ${selectedMovies.length} filmes${limit ? ` (limit=${limit})` : ""}...`,
        );

        const prepared = selectedMovies
          .map((movie) => {
            const streamId = movie.stream_id?.toString();
            const originalName = movie.name || movie.title;

            if (!streamId || !originalName) return null;

            const normalizedTitle = normalizeTitle(originalName);

            if (!normalizedTitle) return null;

            return {
              stream_id: streamId,
              original_name: originalName,
              normalized_title: normalizedTitle,
              year: extractYear(movie),
              poster_url: movie.stream_icon || null,
            };
          })
          .filter(
            (
              item,
            ): item is {
              stream_id: string;
              original_name: string;
              normalized_title: string;
              year: number | null;
              poster_url: string | null;
            } => item !== null,
          );

        const sourceByStream = new Map<string, (typeof prepared)[number]>();

        for (const item of prepared) {
          sourceByStream.set(item.stream_id, item);
        }

        const uniquePrepared = [...sourceByStream.values()];

        console.log(
          `[sync-catalog] Itens válidos após normalização: ${uniquePrepared.length}.`,
        );

        console.log(
          "[sync-catalog] Consultando vínculos já existentes no Supabase...",
        );

        const existingStreamIds = new Set<string>();
        const pageSize = 1000;

        for (let from = 0; ; from += pageSize) {
          const { data, error } = await supabaseAdmin
            .from("media_source_items")
            .select("stream_id")
            .eq("lista_id", lista_id)
            .eq("media_type", "movie")
            .range(from, from + pageSize - 1);

          if (error) throw error;

          const rows = data ?? [];

          for (const row of rows) {
            existingStreamIds.add(row.stream_id);
          }

          if (rows.length < pageSize) break;
        }

        const newSourceItems = uniquePrepared.filter(
          (item) => !existingStreamIds.has(item.stream_id),
        );

        console.log(
          `[sync-catalog] Novos vínculos a criar: ${newSourceItems.length}. Já existentes: ${uniquePrepared.length - newSourceItems.length}.`,
        );

        if (newSourceItems.length === 0) {
          const totalElapsed = Date.now() - startedAt;

          console.log(
            `[sync-catalog] Catálogo já sincronizado. Finalizado em ${totalElapsed} ms.`,
          );

          return Response.json({
            success: true,
            lista_id,
            lista_nome: lista.nome,
            total_recebido: rawMovies.length,
            total_processado: uniquePrepared.length,
            novos_catalogos: 0,
            novos_vinculos: 0,
            ja_existentes: uniquePrepared.length,
            xtream_elapsed_ms: xtreamElapsed,
            total_elapsed_ms: totalElapsed,
            message: "Catálogo já estava sincronizado.",
          });
        }

        console.log(
          "[sync-catalog] Carregando biblioteca central já existente...",
        );

        const catalogByKey = new Map<string, string>();

        for (let from = 0; ; from += pageSize) {
          const { data, error } = await supabaseAdmin
            .from("media_catalog")
            .select("id, normalized_title, year")
            .eq("media_type", "movie")
            .range(from, from + pageSize - 1);

          if (error) throw error;

          const rows = (data ?? []) as CatalogRow[];

          for (const row of rows) {
            catalogByKey.set(
              catalogKey(row.normalized_title, row.year),
              row.id,
            );
          }

          if (rows.length < pageSize) break;
        }

        console.log(
          `[sync-catalog] Biblioteca central carregada: ${catalogByKey.size} registros.`,
        );

        const missingCatalogByKey = new Map<
          string,
          {
            title: string;
            normalized_title: string;
            year: number | null;
            media_type: "movie";
            poster_url: string | null;
            trailer_status: "pending";
          }
        >();

        for (const item of newSourceItems) {
          const key = catalogKey(item.normalized_title, item.year);

          if (!catalogByKey.has(key) && !missingCatalogByKey.has(key)) {
            missingCatalogByKey.set(key, {
              title: item.original_name,
              normalized_title: item.normalized_title,
              year: item.year,
              media_type: "movie",
              poster_url: item.poster_url,
              trailer_status: "pending",
            });
          }
        }

        console.log(
          `[sync-catalog] Novos títulos na biblioteca central: ${missingCatalogByKey.size}.`,
        );

        let novosCatalogos = 0;

        const catalogBatches = chunkArray(
          [...missingCatalogByKey.values()],
          500,
        );

        for (let index = 0; index < catalogBatches.length; index++) {
          const batch = catalogBatches[index];

          if (batch.length === 0) continue;

          console.log(
            `[sync-catalog] Inserindo lote de catálogos ${index + 1}/${catalogBatches.length} (${batch.length} registros)...`,
          );

          const { data, error } = await supabaseAdmin
            .from("media_catalog")
            .insert(batch)
            .select("id, normalized_title, year");

          if (error) throw error;

          for (const row of (data ?? []) as CatalogRow[]) {
            catalogByKey.set(
              catalogKey(row.normalized_title, row.year),
              row.id,
            );
            novosCatalogos++;
          }
        }

        const sourceRows = newSourceItems
          .map((item) => {
            const mediaCatalogId = catalogByKey.get(
              catalogKey(item.normalized_title, item.year),
            );

            if (!mediaCatalogId) return null;

            return {
              lista_id,
              stream_id: item.stream_id,
              media_type: "movie" as const,
              original_name: item.original_name,
              normalized_title: item.normalized_title,
              year: item.year,
              media_catalog_id: mediaCatalogId,
            };
          })
          .filter(
            (
              row,
            ): row is {
              lista_id: string;
              stream_id: string;
              media_type: "movie";
              original_name: string;
              normalized_title: string;
              year: number | null;
              media_catalog_id: string;
            } => row !== null,
          );

        let novosVinculos = 0;

        const sourceBatches = chunkArray(sourceRows, 500);

        for (let index = 0; index < sourceBatches.length; index++) {
          const batch = sourceBatches[index];

          if (batch.length === 0) continue;

          console.log(
            `[sync-catalog] Inserindo lote de vínculos ${index + 1}/${sourceBatches.length} (${batch.length} registros)...`,
          );

          const { error } = await supabaseAdmin
            .from("media_source_items")
            .insert(batch);

          if (error) throw error;

          novosVinculos += batch.length;
        }

        const totalElapsed = Date.now() - startedAt;

        console.log(
          `[sync-catalog] Finalizado com sucesso em ${totalElapsed} ms. Novos catálogos: ${novosCatalogos}. Novos vínculos: ${novosVinculos}.`,
        );

        return Response.json({
          success: true,
          lista_id,
          lista_nome: lista.nome,
          total_recebido: rawMovies.length,
          total_processado: uniquePrepared.length,
          novos_catalogos: novosCatalogos,
          novos_vinculos: novosVinculos,
          ja_existentes: uniquePrepared.length - newSourceItems.length,
          xtream_elapsed_ms: xtreamElapsed,
          total_elapsed_ms: totalElapsed,
        });
      } catch (err: unknown) {
        console.error("[sync-catalog] Erro:", err);

        const message =
          err instanceof Error ? err.message : "Erro interno na sincronização";

        return Response.json(
          {
            error: message,
            etapa: "internal",
          },
          { status: 500 },
        );
      }
    },
  },
};
