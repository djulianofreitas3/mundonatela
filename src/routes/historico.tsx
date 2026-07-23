import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { getHistory } from "@/lib/history.functions";
import { format } from "date-fns";
import { History as HistoryIcon, Loader2, Monitor, User, Tv, Clock } from "lucide-react";

export const Route = createFileRoute("/historico")({
  component: HistoryPage,
});

function HistoryPage() {
  const getHistoryFn = useServerFn(getHistory);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => getHistoryFn(),
  });

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'activation': return { label: 'Ativação', color: 'bg-green-100 text-green-800' };
      case 'renewal': return { label: 'Renovação', color: 'bg-blue-100 text-blue-800' };
      case 'block': return { label: 'Bloqueio', color: 'bg-red-100 text-red-800' };
      case 'unblock': return { label: 'Desbloqueio', color: 'bg-green-100 text-green-800' };
      default: return { label: action, color: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <Layout title="Histórico de Ações">
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
                  <th className="px-6 py-4">Data / Hora</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Dispositivo</th>
                  <th className="px-6 py-4">Cliente / Lista</th>
                  <th className="px-6 py-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.isArray(history) && history.map((item: any) => {
                  const action = getActionLabel(item.action);
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-muted-foreground" />
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${action.color}`}>
                          {action.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium flex items-center gap-1">
                          <Monitor size={14} className="text-muted-foreground" />
                          {(item.dispositivo as any)?.device_name || "Desconhecido"}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {(item.dispositivo as any)?.installation_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User size={14} className="text-muted-foreground" />
                          {(item.cliente as any)?.nome || "-"}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Tv size={12} />
                          {(item.lista as any)?.nome || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                        {item.details ? JSON.stringify(item.details) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {Array.isArray(history) && history.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">Nenhum registro no histórico.</div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
