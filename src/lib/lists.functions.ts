import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getLists = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("listas_iptv")
      .select(`
        *,
        cliente:clientes(nome)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createList = createServerFn({ method: "POST" })
  .validator((data: unknown) => 
    z.object({
      nome: z.string().min(1, "Nome é obrigatório"),
      url: z.string().url("URL inválida"),
      usuario: z.string().min(1, "Usuário é obrigatório"),
      senha: z.string().min(1, "Senha é obrigatória"),
      status: z.string().default("ativo"),
      vencimento: z.string().optional(),
      cliente_id: z.string().uuid().optional(),
    }).parse(data)
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Normalize URL
    let normalizedUrl = input.url.trim().replace(/\/+$/, "");
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `http://${normalizedUrl}`;
    }

    const { data, error } = await supabaseAdmin
      .from("listas_iptv")
      .insert([{ ...input, url: normalizedUrl }])
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const testXtreamConnection = createServerFn({ method: "POST" })
  .validator((data: unknown) => 
    z.object({
      url: z.string().url(),
      username: z.string(),
      password: z.string(),
    }).parse(data)
  )
  .handler(async ({ data: { url, username, password } }) => {
    try {
      const baseUrl = url.trim().replace(/\/+$/, "");
      const testUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
      
      const response = await fetch(testUrl, { signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) {
        return { success: false, message: `Servidor retornou status ${response.status}` };
      }

      const data = await response.json();
      
      if (data.user_info && data.user_info.auth === 1) {
        return { success: true, message: "Conexão bem-sucedida!", info: data.user_info };
      } else {
        return { success: false, message: "Credenciais inválidas ou resposta inesperada." };
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        return { success: false, message: "Tempo de resposta esgotado (Timeout)." };
      }
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }
  });
