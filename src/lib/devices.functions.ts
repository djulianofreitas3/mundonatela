import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getDevices = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("dispositivos")
      .select(`
        *,
        cliente:clientes(nome)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const updateDevice = createServerFn({ method: "POST" })
  .validator((data: unknown) => 
    z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'active', 'expired', 'blocked', 'revoked']).optional(),
      expires_at: z.string().optional(),
      cliente_id: z.string().uuid().nullable().optional(),
    }).parse(data)
  )
  .handler(async ({ data: { id, ...input } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("dispositivos")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const getPendingActivations = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("codigos_ativacao")
      .select(`
        *,
        dispositivo:dispositivos(id, device_name, installation_id)
      `)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const activateDeviceAction = createServerFn({ method: "POST" })
  .validator((data: unknown) => 
    z.object({
      activation_code_id: z.string().uuid().optional(),
      code: z.string().optional(), // Added for manual activation
      cliente_id: z.string().uuid(),
      lista_id: z.string().uuid(),
      expires_at: z.string(),
      observacao: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let targetCodeId = data.activation_code_id;
    let dispositivoId: string | null = null;

    // 1. Resolve code if manual string provided
    if (!targetCodeId && data.code) {
      const { data: foundCode, error: findErr } = await supabaseAdmin
        .from("codigos_ativacao")
        .select("id, used_at, expires_at, dispositivo:dispositivos(id)")
        .eq("code", data.code.toUpperCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (findErr || !foundCode) throw new Error("Código inexistente.");
      if (foundCode.used_at) throw new Error("Código já utilizado.");
      if (new Date(foundCode.expires_at) < new Date()) throw new Error("Código expirado.");
      
      targetCodeId = foundCode.id;
      dispositivoId = (foundCode.dispositivo as any)?.id;
    }

    // 2. Get activation code if using ID
    if (targetCodeId && !dispositivoId) {
      const { data: code, error: codeErr } = await supabaseAdmin
        .from("codigos_ativacao")
        .select("*, dispositivo:dispositivos(id)")
        .eq("id", targetCodeId)
        .single();
      
      if (codeErr || !code || code.used_at) throw new Error("Código inválido ou já utilizado.");
      dispositivoId = (code.dispositivo as any).id;
    }

    if (!dispositivoId) throw new Error("Dispositivo não encontrado.");

    // 3. Update device
    const { error: devErr } = await supabaseAdmin
      .from("dispositivos")
      .update({
        cliente_id: data.cliente_id,
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: data.expires_at,
        device_token: crypto.randomUUID(),
      })
      .eq("id", dispositivoId);

    if (devErr) throw devErr;

    // 4. Link list
    const { error: linkErr } = await supabaseAdmin
      .from("dispositivo_lista")
      .upsert({ dispositivo_id: dispositivoId, lista_id: data.lista_id }, { onConflict: 'dispositivo_id,lista_id' });

    if (linkErr) throw linkErr;

    // 5. Mark code as used
    await supabaseAdmin
      .from("codigos_ativacao")
      .update({ used_at: new Date().toISOString() })
      .eq("id", targetCodeId);

    // 6. Register history
    await supabaseAdmin
      .from("historico_ativacoes")
      .insert({
        dispositivo_id: dispositivoId,
        cliente_id: data.cliente_id,
        lista_id: data.lista_id,
        action: 'activation',
        details: { 
          method: 'admin_panel', 
          activated_at: new Date().toISOString(),
          observacao: data.observacao 
        }
      });

    return { success: true };
  });
