import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getHistory = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("historico_ativacoes")
      .select(`
        *,
        dispositivo:dispositivos(device_name, installation_id),
        cliente:clientes(nome),
        lista:listas_iptv(nome)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });
