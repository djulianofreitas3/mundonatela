import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Monitor, Calendar, ShieldCheck, ShieldX, RefreshCw, Unlink, Loader2, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDevices, updateDevice } from "@/lib/devices.functions";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dispositivos")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: Devices,
});


function Devices() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const getDevicesFn = useServerFn(getDevices);
  const updateDeviceFn = useServerFn(updateDevice);

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevicesFn(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateDeviceFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Dispositivo atualizado!");
    },
    onError: (err: any) => {
      toast.error(`Falha ao atualizar: ${err.message}`);
    }
  });


  const filteredDevices = Array.isArray(devices) ? devices.filter((d: any) => 
    (d.device_name?.toLowerCase().includes(search.toLowerCase())) ||
    (d.cliente?.nome?.toLowerCase().includes(search.toLowerCase())) ||
    (d.installation_id.includes(search))
  ) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout title="Dispositivos">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, cliente ou ID..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
                  <th className="px-6 py-4">Aparelho / Instalação</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Último Acesso</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDevices.map((device: any) => (
                  <tr key={device.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium flex items-center gap-2">
                        <Monitor size={16} className="text-muted-foreground" />
                        {device.device_name || "Dispositivo Desconhecido"}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">
                        ID: {device.installation_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {device.cliente?.nome || <span className="text-muted-foreground italic">Não vinculado</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {device.expires_at ? (
                        <div className="flex items-center gap-1 text-yellow-700">
                          <Calendar size={14} />
                          {format(new Date(device.expires_at), "dd/MM/yyyy")}
                        </div>
                      ) : (
                        <span className="text-green-600 font-bold uppercase text-[10px]">Permanente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {device.last_seen_at ? (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {format(new Date(device.last_seen_at), "dd/MM HH:mm")}
                        </div>
                      ) : "Nunca"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {device.status === 'blocked' ? (
                          <button 
                            onClick={() => updateMutation.mutate({ id: device.id, status: 'active' })}
                            className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors" 
                            title="Desbloquear"
                          >
                            <ShieldCheck size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateMutation.mutate({ id: device.id, status: 'blocked' })}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" 
                            title="Bloquear"
                          >
                            <ShieldX size={18} />
                          </button>
                        )}
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-blue-600" title="Renovar">
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          onClick={() => updateMutation.mutate({ id: device.id, cliente_id: null, status: 'pending' })}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-orange-600" 
                          title="Desvincular"
                        >
                          <Unlink size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDevices.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">Nenhum dispositivo encontrado.</div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
