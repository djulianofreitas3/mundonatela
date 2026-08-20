import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const [clientsCount, devicesCount, pendingCount, expiredCount, blockedCount, listsCount, supportCount] = await Promise.all([
      supabaseAdmin.from("clientes").select("*", { count: "exact", head: true }).eq("status", "ativo"),
      supabaseAdmin.from("dispositivos").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("codigos_ativacao").select("*", { count: "exact", head: true }).is("used_at", null).gt("expires_at", new Date().toISOString()),
      supabaseAdmin.from("dispositivos").select("*", { count: "exact", head: true }).lt("expires_at", new Date().toISOString()),
      supabaseAdmin.from("dispositivos").select("*", { count: "exact", head: true }).eq("status", "blocked"),
      supabaseAdmin.from("listas_iptv").select("*", { count: "exact", head: true }).eq("status", "ativo"),
      supabaseAdmin.from("support_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
    ]);

    const recentActivations = await supabaseAdmin
      .from("historico_ativacoes")
      .select(`
        id,
        created_at,
        action,
        dispositivo:dispositivos(device_name),
        cliente:clientes(nome)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      stats: [
        { label: "Clientes Ativos", value: clientsCount.count || 0, color: "text-blue-500" },
        { label: "Dispositivos Ativos", value: devicesCount.count || 0, color: "text-green-500" },
        { label: "Ativações Pendentes", value: pendingCount.count || 0, color: "text-yellow-500" },
        { label: "Solicitações Novas", value: supportCount.count || 0, color: "text-rose-500" },
        { label: "Vencidos", value: expiredCount.count || 0, color: "text-orange-500" },
        { label: "Bloqueados", value: blockedCount.count || 0, color: "text-red-500" },
        { label: "Listas Ativas", value: listsCount.count || 0, color: "text-purple-500" },
      ],
      recentActivations: recentActivations.data || []
    };
  });
