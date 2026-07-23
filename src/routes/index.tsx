/**
 * CONFIGURAÇÃO DE ACESSO E CONTRATO DA API PÚBLICA (ANDROID)
 * 
 * 1. ACESSO ADMINISTRATIVO:
 *    Email: admin@mundonatela.com
 *    Senha: admin123456
 * 
 * 2. CONTRATO DA API PÚBLICA (ATIVAÇÃO ANDROID):
 *    URL Base: https://mundonatela.lovable.app
 * 
 *    A. Registro do Dispositivo (Primeiro Acesso)
 *       POST /api/public/device/register
 *       Body: { "installation_id": "STRING_UNICA", "device_name": "MODELO_DISPOSITIVO" }
 *       Resp: { "success": true, "device_id": "UUID", "status": "pending" }
 * 
 *    B. Solicitar Código de Ativação (Exibir na Tela do App)
 *       POST /api/public/device/request-code
 *       Body: { "installation_id": "STRING_UNICA" }
 *       Resp: { "success": true, "code": "6_CHAR_CODE", "request_id": "UUID", "poll_token": "UUID" }
 *       Nota: O app deve guardar request_id e poll_token para o próximo passo.
 * 
 *    C. Consultar Status (Polling - A cada 5-10 segundos)
 *       POST /api/public/device/poll
 *       Body: { "request_id": "UUID", "poll_token": "UUID" }
 *       Respostas:
 *       - { "status": "pending" } -> Continuar aguardando
 *       - { "status": "approved", "device_token": "UUID" } -> Ativado! Guardar device_token.
 *       - { "status": "rejected" | "expired" | "blocked" } -> Parar e informar usuário.
 * 
 *    D. Verificar Configuração e Lista (A cada abertura do App)
 *       POST /api/public/device/check
 *       Body: { "installation_id": "STRING_UNICA", "device_token": "UUID" }
 *       OU Header: Authorization: Bearer UUID
 *       Resp: { 
 *         "status": "active", 
 *         "expires_at": "ISO_DATE",
 *         "config": { 
 *           "client_name": "NOME", 
 *           "lists": [{ "name": "LISTA", "url": "...", "username": "...", "password": "..." }] 
 *         }
 *       }
 * 
 * 3. ARQUIVOS IMPLEMENTADOS:
 *    - src/routes/api/public/device/register.ts
 *    - src/routes/api/public/device/request-code.ts
 *    - src/routes/api/public/device/poll.ts
 *    - src/routes/api/public/device/check.ts
 * 
 * 4. RESULTADO DO ÚLTIMO BUILD:
 *    Comando: npm run build
 *    Resultado: Sucesso (Exit code: 0)
 *    Arquivo Hotfix: src/routes/api/public/device/check.ts (Proteção de result.data)
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { Users, Monitor, Clock, Calendar, ShieldAlert, List, Loader2, History, Plus } from "lucide-react";
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
                <a href="/dispositivos" className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-center">
                  <Monitor className="mx-auto mb-2 text-gray-600" size={24} />
                  <span className="text-xs font-bold text-gray-600 uppercase">Ver Dispositivos</span>
                </a>
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