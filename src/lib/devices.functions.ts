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
      activation_code_id: z.string().uuid(),
      cliente_id: z.string().uuid(),
      lista_id: z.string().uuid(),
      expires_at: z.string(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Get activation code
    const { data: code, error: codeErr } = await supabaseAdmin
      .from("codigos_ativacao")
      .select("*, dispositivo:dispositivos(id)")
      .eq("id", data.activation_code_id)
      .single();
    
    if (codeErr || !code || code.used_at) throw new Error("Código inválido ou já utilizado.");

    const dispositivoId = (code.dispositivo as any).id;

    // 2. Update device
    const { error: devErr } = await supabaseAdmin
      .from("dispositivos")
      .update({
        cliente_id: data.cliente_id,
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: data.expires_at,
        device_token: crypto.randomUUID(), // Generate new secure token
      })
      .eq("id", dispositivoId);

    if (devErr) throw devErr;

    // 3. Link list
    const { error: linkErr } = await supabaseAdmin
      .from("dispositivo_lista")
      .upsert({ dispositivo_id: dispositivoId, lista_id: data.lista_id }, { onConflict: 'dispositivo_id,lista_id' });

    if (linkErr) throw linkErr;

    // 4. Mark code as used
    await supabaseAdmin
      .from("codigos_ativacao")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.activation_code_id);

    // 5. Register history
    await supabaseAdmin
      .from("historico_ativacoes")
      .insert({
        dispositivo_id: dispositivoId,
        cliente_id: data.cliente_id,
        lista_id: data.lista_id,
        action: 'activation',
        details: { method: 'admin_panel', activated_at: new Date().toISOString() }
      });

    return { success: true };
  });
