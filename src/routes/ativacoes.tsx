import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Check, X, User, List, Loader2, Calendar, Clock, Smartphone, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingActivations, activateDeviceAction } from "@/lib/devices.functions";
import { getClients } from "@/lib/clients.functions";
import { getLists } from "@/lib/lists.functions";
import { format, differenceInMinutes, parseISO } from "date-fns";

export const Route = createFileRoute("/ativacoes")({
  component: PendingActivations,
});

function PendingActivations() {
  const [search, setSearch] = useState("");
  const [selectedActivation, setSelectedActivation] = useState<any>(null);
  const [activationForm, setActivationForm] = useState({
    cliente_id: "",
    lista_id: "",
    expires_at: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  });

  const queryClient = useQueryClient();
  const getActivationsFn = useServerFn(getPendingActivations);
  const getClientsFn = useServerFn(getClients);
  const getListsFn = useServerFn(getLists);
  const activateFn = useServerFn(activateDeviceAction);

  const { data: activations = [], isLoading } = useQuery({
    queryKey: ["pending-activations"],
    queryFn: () => getActivationsFn(),
    refetchInterval: 15000 // Auto refresh every 15s
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-all"],
    queryFn: () => getClientsFn(),
  });

  const { data: lists = [] } = useQuery({
    queryKey: ["lists-all"],
    queryFn: () => getListsFn(),
  });

  const activateMutation = useMutation({
    mutationFn: (data: any) => activateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-activations"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setSelectedActivation(null);
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationForm.cliente_id || !activationForm.lista_id) return;
    
    activateMutation.mutate({
      activation_code_id: selectedActivation.id,
      cliente_id: activationForm.cliente_id,
      lista_id: activationForm.lista_id,
      expires_at: new Date(activationForm.expires_at).toISOString()
    });
  };

  const filteredActivations = Array.isArray(activations) ? activations.filter((a: any) => 
    a.code.includes(search) || (a.dispositivo as any)?.device_name?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <Layout title="Ativações Pendentes">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Pesquisar código ou dispositivo..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Dispositivo</th>
                    <th className="px-6 py-4">Solicitação</th>
                    <th className="px-6 py-4">Expira em</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredActivations.map((item: any) => {
                    const minsRemaining = differenceInMinutes(parseISO(item.expires_at), new Date());
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedActivation?.id === item.id ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelectedActivation(item)}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-primary">{item.code}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{(item.dispositivo as any)?.device_name || "Desconhecido"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{(item.dispositivo as any)?.installation_id}</div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {format(parseISO(item.created_at), "HH:mm:ss")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            minsRemaining < 5 ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <Clock size={12} className="mr-1" />
                            {minsRemaining} min
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivation(item);
                            }}
                          >
                            <Check size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredActivations.length === 0 && !isLoading && (
                <div className="p-12 text-center text-muted-foreground italic">
                  Nenhuma ativação pendente no momento.
                </div>
              )}
              {isLoading && (
                <div className="p-12 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          {selectedActivation ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Smartphone size={20} className="text-primary" />
                Ativar Dispositivo
              </h3>
              <div className="space-y-4 mb-6 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Código:</span> 
                  <span className="font-mono font-bold ml-2 text-primary">{selectedActivation.code}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Aparelho:</span> 
                  <span className="font-medium ml-2">{(selectedActivation.dispositivo as any)?.device_name}</span>
                </div>
              </div>

              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Selecionar Cliente</label>
                  <select 
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    value={activationForm.cliente_id}
                    onChange={(e) => setActivationForm({...activationForm, cliente_id: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Selecionar Lista Xtream</label>
                  <select 
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    value={activationForm.lista_id}
                    onChange={(e) => setActivationForm({...activationForm, lista_id: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {lists.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.nome} ({l.usuario})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimento da Ativação</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    value={activationForm.expires_at}
                    onChange={(e) => setActivationForm({...activationForm, expires_at: e.target.value})}
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit"
                    disabled={activateMutation.isPending}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {activateMutation.isPending && <Loader2 size={18} className="animate-spin" />}
                    Confirmar Ativação
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedActivation(null)}
                    className="p-2 border border-border rounded-lg hover:bg-muted"
                  >
                    <X size={20} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[300px]">
              <AlertCircle size={40} className="mb-4 opacity-20" />
              <p>Selecione uma solicitação na lista para processar a ativação.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
