import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, RefreshCw, Film, Tv, Youtube, Pencil, AlertTriangle } from "lucide-react";
import {
  getMediaSources,
  getMediaStats,
  getMediaItems,
  updateCatalogTrailer,
  startCatalogSync,
  runCatalogSyncBatch,
  getSyncJob,
} from "@/lib/media.functions";

type FilterKey = "all" | "with_trailer" | "without_trailer" | "review";

export const Route = createFileRoute("/trailers")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Trailers e Metadados — Painel IPTV" },
      { name: "description", content: "Gerencie trailers, pôsteres e metadados do catálogo de mídia das listas cadastradas." },
      { property: "og:title", content: "Trailers e Metadados — Painel IPTV" },
      { property: "og:description", content: "Biblioteca central de mídia com trailers e prévias para o aplicativo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Trailers,
});

function Trailers() {
  const queryClient = useQueryClient();
  const [listaId, setListaId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editing, setEditing] = useState<any>(null);
  const [trailerInput, setTrailerInput] = useState("");
  const [syncing, setSyncing] = useState(false);

  const getSourcesFn = useServerFn(getMediaSources);
  const getStatsFn = useServerFn(getMediaStats);
  const getItemsFn = useServerFn(getMediaItems);
  const updateTrailerFn = useServerFn(updateCatalogTrailer);
  const startSyncFn = useServerFn(startCatalogSync);
  const runBatchFn = useServerFn(runCatalogSyncBatch);
  const getJobFn = useServerFn(getSyncJob);

  const { data: sources = [] } = useQuery({
    queryKey: ["media-sources"],
    queryFn: () => getSourcesFn(),
  });

  useEffect(() => {
    if (!listaId && sources.length > 0) setListaId(sources[0]!.id);
  }, [sources, listaId]);

  const filters = { lista_id: listaId || undefined };

  const { data: stats } = useQuery({
    queryKey: ["media-stats", listaId],
    queryFn: () => getStatsFn({ data: filters }),
    enabled: Boolean(listaId),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media-items", listaId, search, filter],
    queryFn: () => getItemsFn({ data: { ...filters, search: search || undefined, filter, limit: 100 } }),
    enabled: Boolean(listaId),
  });

  const { data: job } = useQuery({
    queryKey: ["media-sync-job", listaId],
    queryFn: () => getJobFn({ data: { lista_id: listaId } }),
    enabled: Boolean(listaId),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { media_catalog_id: string; youtube_input: string }) =>
      updateTrailerFn({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-items"] });
      queryClient.invalidateQueries({ queryKey: ["media-stats"] });
      setEditing(null);
      toast.success("Trailer atualizado.");
    },
    onError: (error: any) => toast.error(error?.message ?? "Falha ao salvar trailer."),
  });

  /**
   * Runs the sync in background batches: the server processes a slice per call
   * so the panel stays responsive and can be closed at any time.
   */
  const handleSync = async () => {
    if (!listaId) return;
    setSyncing(true);
    try {
      const created: any = await startSyncFn({ data: { lista_id: listaId } });
      let current: any = created;
      let guard = 0;
      while (current && current.status !== "completed" && current.status !== "failed" && guard < 500) {
        current = await runBatchFn({ data: { job_id: current.id } });
        guard += 1;
        queryClient.setQueryData(["media-sync-job", listaId], current);
      }
      if (current?.status === "failed") {
        toast.error(`Sincronização falhou: ${current.error_message}`);
      } else {
        toast.success(`Catálogo sincronizado: ${current?.processed_count ?? 0} itens.`);
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Erro na sincronização.");
    } finally {
      setSyncing(false);
      queryClient.invalidateQueries({ queryKey: ["media-items"] });
      queryClient.invalidateQueries({ queryKey: ["media-stats"] });
      queryClient.invalidateQueries({ queryKey: ["media-sync-job"] });
    }
  };

  const cards = [
    { label: "Total de itens", value: stats?.total ?? 0, color: "text-primary" },
    { label: "Com trailer", value: stats?.with_trailer ?? 0, color: "text-green-600" },
    { label: "Sem trailer", value: stats?.without_trailer ?? 0, color: "text-amber-600" },
    { label: "Precisa revisar", value: stats?.review ?? 0, color: "text-rose-600" },
  ];

  const filterButtons: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "with_trailer", label: "Com trailer" },
    { key: "without_trailer", label: "Sem trailer" },
    { key: "review", label: "Revisar" },
  ];

  return (
    <Layout title="Trailers">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <select
            value={listaId}
            onChange={(event) => setListaId(event.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground min-w-[220px]"
          >
            {sources.length === 0 && <option value="">Nenhuma lista cadastrada</option>}
            {sources.map((source: any) => (
              <option key={source.id} value={source.id}>{source.nome}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título..."
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground"
            />
          </div>

          <button
            onClick={handleSync}
            disabled={!listaId || syncing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Sincronizar catálogo
          </button>
        </div>

        {job && job.status !== "completed" && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            Sincronização {job.status}: {job.processed_count}/{job.total_count || "?"} itens
            {job.error_message ? ` — ${job.error_message}` : ""}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {filterButtons.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === item.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Nenhum item encontrado. Use “Sincronizar catálogo” para importar os títulos da lista.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-left px-4 py-3">Ano</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Trailer</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Fonte</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="px-4 py-3 text-foreground">{item.original_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.year ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        {item.media_type === "movie" ? <Film size={14} /> : <Tv size={14} />}
                        {item.media_type === "movie" ? "Filme" : "Série"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.catalog?.youtube_trailer_id ? (
                        <a
                          href={item.catalog.trailer_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Youtube size={14} /> {item.catalog.youtube_trailer_id}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs uppercase font-semibold text-muted-foreground">
                        {item.catalog?.trailer_status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.lista?.nome ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditing(item);
                          setTrailerInput(item.catalog?.youtube_trailer_id ?? "");
                        }}
                        disabled={!item.catalog?.id}
                        className="text-muted-foreground hover:text-primary disabled:opacity-40"
                        aria-label="Editar trailer"
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Editar trailer</h2>
            <p className="text-sm text-muted-foreground">{editing.original_name}</p>
            <input
              value={trailerInput}
              onChange={(event) => setTrailerInput(event.target.value)}
              placeholder="ID do YouTube ou URL completa"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle size={14} className="mt-0.5" />
              Deixe em branco para remover o trailer atual.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  saveMutation.mutate({
                    media_catalog_id: editing.catalog.id,
                    youtube_input: trailerInput,
                  })
                }
                disabled={saveMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
