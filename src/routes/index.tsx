/**
 * Me envie aqui no chat o conteúdo COMPLETO do arquivo API_CONTRACT.md.
 *
 * Quero o contrato técnico completo para integração com o aplicativo Android, incluindo:
 *
 * 1. URL completa do endpoint de envio de solicitação;
 * 2. URL completa do endpoint de consulta de pedidos do usuário;
 * 3. método HTTP de cada endpoint;
 * 4. todos os headers obrigatórios;
 * 5. como deve ser enviado o token do dispositivo;
 * 6. se continua sendo necessário o header apikey;
 * 7. JSON completo para pedido de Filme;
 * 8. JSON completo para pedido de Série;
 * 9. JSON completo para pedido de Canal;
 * 10. JSON completo para Reportar Problema;
 * 11. campos content_id, series_id, season_number, episode_number e episode_id;
 * 12. exemplo completo da resposta de sucesso do POST;
 * 13. exemplo da resposta quando o pedido é duplicado;
 * 14. código HTTP utilizado para duplicidade;
 * 15. exemplo completo da resposta GET de "Pedidos solicitados";
 * 16. todos os valores possíveis de status;
 * 17. como o backend identifica que o usuário só pode consultar os próprios pedidos;
 * 18. se xtream_username deve ser enviado no GET ou se é identificado pelo token;
 * 19. campos obrigatórios e opcionais;
 * 20. exemplos de erros 400, 401, 403, 409 e 500, se aplicável.
 *
 * Não altere mais nada no projeto.
 *
 * Quero somente o conteúdo técnico completo do API_CONTRACT.md para integrar no aplicativo Android.
 */






import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { Users, Monitor, Clock, Calendar, ShieldAlert, List, Loader2, History, Plus, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ActivationModal } from "@/components/ActivationModal";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const getStatsFn = useServerFn(getDashboardStats);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getStatsFn(),
    refetchInterval: 30000 // Refresh every 30s
  });

  const iconMap: Record<string, any> = {
    "Clientes Ativos": Users,
    "Dispositivos Ativos": Monitor,
    "Ativações Pendentes": Clock,
    "Vencidos": Calendar,
    "Bloqueados": ShieldAlert,
    "Listas Ativas": List,
    "Solicitações Novas": MessageSquare,
  };

  return (
    <Layout title="Dashboard">
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.stats.map((stat: any, i: number) => {
              const Icon = iconMap[stat.label] || Monitor;
              return (
                <div key={i} className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History size={20} className="text-primary" />
                Histórico Recente
              </h3>
              <div className="space-y-4">
                {data?.recentActivations.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum registro recente.</p>
                ) : (
                  data?.recentActivations.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{(item.dispositivo as any)?.device_name || "Dispositivo"}</span>
                        <span className="text-xs text-muted-foreground">{(item.cliente as any)?.nome || "Sem cliente"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] block font-mono text-muted-foreground">{format(new Date(item.created_at), "dd/MM HH:mm")}</span>
                        <span className={`text-[10px] uppercase font-bold ${item.action === 'activation' ? 'text-green-600' : 'text-blue-600'}`}>
                          {item.action}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsActivationModalOpen(true)}
                  className="p-4 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-center"
                >
                  <Plus className="mx-auto mb-2 text-primary" size={24} />
                  <span className="text-xs font-bold text-primary uppercase">Ativar Novo</span>
                </button>
                <a href="/clientes" className="p-4 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors text-center">
                  <Users className="mx-auto mb-2 text-green-600" size={24} />
                  <span className="text-xs font-bold text-green-600 uppercase">Novo Cliente</span>
                </a>
                <a href="/listas" className="p-4 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors text-center">
                  <List className="mx-auto mb-2 text-purple-600" size={24} />
                  <span className="text-xs font-bold text-purple-600 uppercase">Nova Lista</span>
                </a>
                <Link to="/dispositivos" className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-center">
                  <Monitor className="mx-auto mb-2 text-gray-600" size={24} />
                  <span className="text-xs font-bold text-gray-600 uppercase">Ver Dispositivos</span>
                </Link>
                <Link to="/solicitacoes" search={{ status: 'new' }} className="p-4 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors text-center">
                  <MessageSquare className="mx-auto mb-2 text-rose-600" size={24} />
                  <span className="text-xs font-bold text-rose-600 uppercase">Solicitações Novas</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      <ActivationModal 
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
      />
    </Layout>
  );
}
