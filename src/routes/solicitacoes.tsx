import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Film, 
  Tv, 
  Inbox,
  Filter,
  Calendar,
  Smartphone,
  Eye,
  Check,
  MoreVertical,
  ArrowRight,
  Info,
  Loader2,
  Clock,
  Trash2,
  CheckSquare,
  Square
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupportRequests, getSupportStats, updateSupportRequest, deleteSupportRequests } from "@/lib/support.functions";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/solicitacoes")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: SupportPage,
});

function SupportPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const getRequestsFn = useServerFn(getSupportRequests);
  const getStatsFn = useServerFn(getSupportStats);
  const updateFn = useServerFn(updateSupportRequest);
  const deleteFn = useServerFn(deleteSupportRequests);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["support-stats"],
    queryFn: () => getStatsFn(),
    refetchInterval: 30000
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["support-requests", activeTab, search, statusFilter],
    queryFn: () => getRequestsFn({
      data: {
        request_type: activeTab === "all" ? undefined : (activeTab as any),
        search: search || undefined,
        status: statusFilter === "all" ? undefined : (statusFilter as any)
      }
    }),
    refetchInterval: 15000
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('support_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_requests' },
        (payload) => {
          toast.info("Nova solicitação recebida!", {
            description: payload.new.title || payload.new.content_name || "Verifique a lista."
          });
          queryClient.invalidateQueries({ queryKey: ["support-requests"] });
          queryClient.invalidateQueries({ queryKey: ["support-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; status?: any; admin_note?: string }) => updateFn({ data: variables }),
    onSuccess: () => {
      toast.success("Solicitação atualizada");
      queryClient.invalidateQueries({ queryKey: ["support-requests"] });
      queryClient.invalidateQueries({ queryKey: ["support-stats"] });
      if (selectedRequest) {
          // Sync local state if detail is open
          refetchStats();
      }
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar: " + err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteFn({ data: { ids } }),
    onSuccess: () => {
      toast.success("Solicitações excluídas");
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["support-requests"] });
      queryClient.invalidateQueries({ queryKey: ["support-stats"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao excluir: " + err.message);
    }
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: string[]) => {
    if (selectedIds.length === ids.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ids);
    }
  };

  const handleDelete = (ids: string[]) => {
    if (confirm(`Tem certeza que deseja excluir ${ids.length} solicitação(ões)?`)) {
      deleteMutation.mutate(ids);
    }
  };

  const handleOpenDetail = (request: any) => {
    setSelectedRequest(request);
    setAdminNote(request.admin_note || "");
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (id: string, newStatus: any) => {
    updateMutation.mutate({ id, status: newStatus });
  };

  const handleSaveNote = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({ id: selectedRequest.id, admin_note: adminNote });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-rose-500 hover:bg-rose-600">Novo</Badge>;
      case 'in_review': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Em análise</Badge>;
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Concluído</Badge>;
      case 'added': return <Badge className="bg-emerald-600 hover:bg-emerald-700">Adicionado</Badge>;
      case 'unavailable': return <Badge className="bg-gray-500 hover:bg-gray-600">Não disponível</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      movie: "Filme",
      series: "Série",
      channel: "Canal",
      player: "Player",
      favorites: "Favoritos",
      multiscreen: "Multitela",
      activation: "Ativação",
      update: "Atualização",
      other: "Outro"
    };
    return labels[category] || category;
  };

  return (
    <Layout title="Solicitações e Suporte">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">Novas</p>
            <h3 className="text-2xl font-bold text-rose-500">{stats?.new || 0}</h3>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">Em análise</p>
            <h3 className="text-2xl font-bold text-yellow-500">{stats?.in_review || 0}</h3>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">Concluídas</p>
            <h3 className="text-2xl font-bold text-green-600">{stats?.completed || 0}</h3>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
            <h3 className="text-2xl font-bold">{stats?.total || 0}</h3>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="content_request">Pedidos de Conteúdo</TabsTrigger>
                <TabsTrigger value="problem_report">Reportar Problema</TabsTrigger>
              </TabsList>
            </Tabs>

            {selectedIds.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDelete(selectedIds)}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Excluir ({selectedIds.length})
              </Button>
            )}
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Pesquisar..." 
                className="pl-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos Status</option>
              <option value="new">Novo</option>
              <option value="in_review">Em análise</option>
              <option value="completed">Concluído</option>
              <option value="added">Adicionado</option>
              <option value="unavailable">Não disponível</option>
            </select>
          </div>
        </div>

        {/* Table/List */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground">Nenhuma solicitação encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border uppercase tracking-wider">
                    <th className="px-6 py-4 w-10">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleSelectAll(requests.map((r: any) => r.id))}
                      >
                        {selectedIds.length === requests.length && requests.length > 0 ? (
                          <CheckSquare size={16} className="text-primary" />
                        ) : (
                          <Square size={16} />
                        )}
                      </Button>
                    </th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Solicitação</th>
                    <th className="px-6 py-4">Dispositivo</th>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((req: any) => (
                    <tr key={req.id} className={`hover:bg-muted/30 transition-colors ${req.status === 'new' ? 'bg-rose-50/20' : ''} ${selectedIds.includes(req.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleToggleSelect(req.id)}
                        >
                          {selectedIds.includes(req.id) ? (
                            <CheckSquare size={16} className="text-primary" />
                          ) : (
                            <Square size={16} />
                          )}
                        </Button>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {req.request_type === 'content_request' ? (
                          <span className="flex items-center gap-1.5 text-blue-600"><Film size={14} /> Pedido</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-orange-600"><AlertTriangle size={14} /> Problema</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {req.xtream_username || <span className="text-muted-foreground italic">Não identificado</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">{getCategoryLabel(req.category)}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate font-medium text-sm">
                          {req.title || req.content_name || req.description || "Sem título"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <div className="font-medium">{req.device_name || "N/A"}</div>
                          <div className="text-muted-foreground">{req.app_version || "-"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {format(parseISO(req.created_at), "dd/MM HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(req)}>
                            <Eye size={16} className="mr-2" /> Detalhes
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete([req.id])}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedRequest?.request_type === 'content_request' ? <Film className="text-blue-600" /> : <AlertTriangle className="text-orange-600" />}
              {selectedRequest?.request_type === 'content_request' ? "Detalhes do Pedido" : "Relato de Problema"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Informações Básicas</label>
                <div className="mt-2 space-y-2">
                  <p className="text-sm"><span className="font-semibold">Usuário:</span> {selectedRequest?.xtream_username || "Não identificado"}</p>
                  <p className="text-sm"><span className="font-semibold">Categoria:</span> {getCategoryLabel(selectedRequest?.category)}</p>
                  {selectedRequest?.content_name && <p className="text-sm"><span className="font-semibold">Nome:</span> {selectedRequest.content_name}</p>}
                  {selectedRequest?.title && <p className="text-sm"><span className="font-semibold">Título:</span> {selectedRequest.title}</p>}
                  {selectedRequest?.year && <p className="text-sm"><span className="font-semibold">Ano:</span> {selectedRequest.year}</p>}
                  {selectedRequest?.season && <p className="text-sm"><span className="font-semibold">Temporada:</span> {selectedRequest.season}</p>}
                  {selectedRequest?.season_number && <p className="text-sm"><span className="font-semibold">Nº Temporada:</span> {selectedRequest.season_number}</p>}
                  {selectedRequest?.episode_number && <p className="text-sm"><span className="font-semibold">Nº Episódio:</span> {selectedRequest.episode_number}</p>}
                  {selectedRequest?.city_state && <p className="text-sm"><span className="font-semibold">Local:</span> {selectedRequest.city_state}</p>}
                </div>
              </div>

              {selectedRequest?.description && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Descrição / Observação</label>
                  <p className="mt-2 text-sm bg-muted p-3 rounded-lg border border-border italic whitespace-pre-wrap">
                    "{selectedRequest.description}"
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Status da Solicitação</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant={selectedRequest?.status === 'in_review' ? 'default' : 'outline'}
                    className={selectedRequest?.status === 'in_review' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'in_review')}
                  >
                    Em análise
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedRequest?.status === 'completed' ? 'default' : 'outline'}
                    className={selectedRequest?.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                  >
                    Concluído
                  </Button>
                  {selectedRequest?.request_type === 'content_request' && (
                    <>
                      <Button 
                        size="sm" 
                        variant={selectedRequest?.status === 'added' ? 'default' : 'outline'}
                        className={selectedRequest?.status === 'added' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'added')}
                      >
                        Adicionado
                      </Button>
                      <Button 
                        size="sm" 
                        variant={selectedRequest?.status === 'unavailable' ? 'default' : 'outline'}
                        className={selectedRequest?.status === 'unavailable' ? 'bg-gray-500 hover:bg-gray-600' : ''}
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'unavailable')}
                      >
                        Não disponível
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Dados do Dispositivo</label>
                <div className="mt-2 space-y-2 text-xs bg-muted/50 p-3 rounded-lg border border-border font-mono">
                  <p><span className="font-bold">Nome:</span> {selectedRequest?.device_name}</p>
                  <p><span className="font-bold">Marca:</span> {selectedRequest?.device_manufacturer}</p>
                  <p><span className="font-bold">Modelo:</span> {selectedRequest?.device_model}</p>
                  <p><span className="font-bold">Android:</span> {selectedRequest?.android_version}</p>
                  <p><span className="font-bold">App Versão:</span> {selectedRequest?.app_version} ({selectedRequest?.version_code})</p>
                  <p className="truncate"><span className="font-bold">ID:</span> {selectedRequest?.installation_id || selectedRequest?.device_id}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Observação Interna (Admin)</label>
                <Textarea 
                  className="mt-2 h-24 text-sm"
                  placeholder="Anotações privadas para a equipe..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
                <Button 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={handleSaveNote}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Check size={14} className="mr-2" />}
                  Salvar Nota
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
