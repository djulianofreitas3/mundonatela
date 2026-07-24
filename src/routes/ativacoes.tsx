import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Check, List as ListIcon, Loader2, Clock, Smartphone, Plus, ShieldCheck, XCircle, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingActivations, cancelActivationRequest, deleteActivationRequest } from "@/lib/devices.functions";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ActivationModal } from "@/components/ActivationModal";

export const Route = createFileRoute("/ativacoes")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: PendingActivations,
});


function PendingActivations() {
  const [search, setSearch] = useState("");
  const [selectedActivation, setSelectedActivation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const getActivationsFn = useServerFn(getPendingActivations);
  const cancelActivationFn = useServerFn(cancelActivationRequest);
  const deleteActivationFn = useServerFn(deleteActivationRequest);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelActivationFn({ data: { id, status: 'cancelled' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-activations"] });
      toast.success("Solicitação cancelada.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteActivationFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-activations"] });
      toast.success("Solicitação excluída.");
    }
  });

  const { data: activations = [], isLoading } = useQuery({
    queryKey: ["pending-activations"],
    queryFn: () => getActivationsFn(),
    refetchInterval: 15000 // Auto refresh every 15s
  });

  const handleOpenActivation = (activation: any) => {
    setSelectedActivation(activation);
    setIsModalOpen(true);
  };

  const filteredActivations = Array.isArray(activations) ? activations.filter((a: any) => 
    a.code.includes(search) || (a.dispositivo as any)?.device_name?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <Layout title="Aguardando Aprovação">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Pesquisar código ou dispositivo..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setSelectedActivation(null);
              setIsModalOpen(true);
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            Ativar por código
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Dispositivo</th>
                  <th className="px-6 py-4">Solicitação</th>
                  <th className="px-6 py-4">Status da Validade</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredActivations.map((item: any) => {
                  const isPermanent = !item.expires_at;
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-primary text-lg">{item.code}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Smartphone size={18} className="text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{(item.dispositivo as any)?.device_name || "Desconhecido"}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{(item.dispositivo as any)?.installation_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(parseISO(item.created_at), "HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPermanent ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          <ShieldCheck size={12} className="mr-1.5" />
                          {isPermanent ? "Código sem vencimento" : "Vence em breve"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenActivation(item)}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                            title="Ativar"
                          >
                            <Check size={14} />
                            ATIVAR
                          </button>
                          
                          <button 
                            onClick={() => {
                              if (confirm("Deseja cancelar esta solicitação?")) {
                                cancelMutation.mutate(item.id);
                              }
                            }}
                            className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            <XCircle size={18} />
                          </button>

                          <button 
                            onClick={() => {
                              if (confirm("Excluir permanentemente esta solicitação de teste?")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            title="Excluir (Admin)"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredActivations.length === 0 && !isLoading && (
              <div className="p-12 text-center text-muted-foreground italic flex flex-col items-center gap-3">
                <Clock size={40} className="opacity-10" />
                <p>Nenhuma solicitação de ativação pendente no momento.</p>
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

      <ActivationModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivation(null);
        }}
        initialCode={selectedActivation?.code}
        activationCodeId={selectedActivation?.id}
        deviceName={selectedActivation?.dispositivo?.device_name}
      />
    </Layout>
  );
}