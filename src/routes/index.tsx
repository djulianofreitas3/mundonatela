import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Users, Monitor, Clock, Calendar, ShieldAlert, List } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  // Mock data for initial UI, will be replaced with real queries
  const stats = [
    { label: "Clientes Ativos", value: "124", icon: Users, color: "text-blue-500" },
    { label: "Dispositivos Ativos", value: "89", icon: Monitor, color: "text-green-500" },
    { label: "Ativações Pendentes", value: "12", icon: Clock, color: "text-yellow-500" },
    { label: "Vencimentos Próximos", value: "5", icon: Calendar, color: "text-orange-500" },
    { label: "Dispositivos Bloqueados", value: "3", icon: ShieldAlert, color: "text-red-500" },
    { label: "Listas Ativas", value: "45", icon: List, color: "text-purple-500" },
  ];

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Ativações Recentes</h3>
          <div className="text-sm text-muted-foreground italic">Nenhuma ativação recente encontrada.</div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Vencimentos Próximos</h3>
          <div className="text-sm text-muted-foreground italic">Nenhum vencimento próximo.</div>
        </div>
      </div>
    </Layout>
  );
}
