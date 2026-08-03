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
      epg_url: z.string().url("URL de EPG inválida").optional().or(z.literal("")),
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
      .insert([{ ...input, url: normalizedUrl, epg_url: input.epg_url?.trim() || null }])
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
      // 1. URL Preservation: Ensure protocol and port are preserved, and no double slashes
      const baseUrl = url.trim().replace(/\/+$/, "");
      const testUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
      
      console.log(`[Xtream Test] Testing endpoint: ${baseUrl}/player_api.php`);

      // 3. Execution: This runs in the backend (TanStack Server Function)
      // 6. Redirects & 7. Timeout
      const response = await fetch(testUrl, { 
        method: "GET",
        signal: AbortSignal.timeout(15000), // 15s timeout
        redirect: "follow" // Follow redirects
      });
      
      // 8 & 9. Handle 403 and other statuses
      if (!response.ok) {
        if (response.status === 403) {
          return { 
            success: false, 
            status: 403,
            message: "O servidor recusou a validação externa. Isso pode acontecer quando o provedor bloqueia conexões de servidores em nuvem. Confirme a URL e a porta ou teste diretamente no aplicativo." 
          };
        }
        if (response.status === 401) {
          return { success: false, status: 401, message: "Autenticação recusada (401)." };
        }
        return { success: false, status: response.status, message: `Servidor retornou status ${response.status}` };
      }

      const data = await response.json();
      
      // Interpretation logic
      if (data.user_info && data.user_info.auth === 1) {
        return { success: true, message: "Conexão bem-sucedida!", info: data.user_info };
      } else if (data.auth === 0 || (data.user_info && data.user_info.auth === 0)) {
        return { success: false, message: "Credenciais inválidas." };
      } else {
        return { success: false, message: "Resposta inesperada do servidor." };
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        return { success: false, message: "Servidor não respondeu (Timeout)." };
      }
      if (error.message?.includes('getaddrinfo') || error.code === 'ENOTFOUND') {
        return { success: false, message: "Erro de DNS: endereço inválido." };
      }
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }
  });
