import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => 
    z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'active', 'expired', 'blocked', 'revoked', 'removed']).optional(),
      expires_at: z.string().nullable().optional(),
      cliente_id: z.string().uuid().nullable().optional(),
      device_token: z.string().nullable().optional(),
    }).parse(data)
  )
  .handler(async ({ data: { id, ...input }, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const userId = context.userId;
    if (!userId) throw new Error("Não autorizado.");

    const updateData: any = { ...input };

    if (input.status === 'removed') {
      updateData.removed_at = new Date().toISOString();
      updateData.removed_by = userId;
      updateData.device_token = null;
    }

    const { data, error } = await supabaseAdmin
      .from("dispositivos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const cancelActivationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => 
    z.object({
      id: z.string().uuid(),
      status: z.enum(['rejected', 'cancelled']),
    }).parse(data)
  )
  .handler(async ({ data: { id } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from("codigos_ativacao")
      .update({ 
        used_at: new Date().toISOString(),
        poll_token: null
      })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  });

export const deleteActivationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from("codigos_ativacao")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
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
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const activateDeviceAction = createServerFn({ method: "POST" })
  .validator((data: unknown) => 
    z.object({
      activation_code_id: z.string().uuid().optional(),
      code: z.string().optional(),
      cliente_id: z.string().uuid(),
      lista_id: z.string().uuid(),
      expires_at: z.string().nullable(),
      observacao: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let targetCodeId = data.activation_code_id;
    let dispositivoId: string | null = null;

    if (!targetCodeId && data.code) {
      const { data: foundCode, error: findErr } = await supabaseAdmin
        .from("codigos_ativacao")
        .select("id, used_at, expires_at, dispositivo:dispositivos(id)")
        .eq("code", data.code.toUpperCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (findErr || !foundCode) throw new Error("Código inexistente.");
      if (foundCode.used_at) throw new Error("Código já processado.");
      
      targetCodeId = foundCode.id;
      dispositivoId = (foundCode.dispositivo as any)?.id;
    }

    if (targetCodeId && !dispositivoId) {
      const { data: code, error: codeErr } = await supabaseAdmin
        .from("codigos_ativacao")
        .select("*, dispositivo:dispositivos(id)")
        .eq("id", targetCodeId)
        .single();
      
      if (codeErr || !code || code.used_at) throw new Error("Código inválido ou já processado.");
      dispositivoId = (code.dispositivo as any).id;
    }

    if (!dispositivoId) throw new Error("Dispositivo não encontrado.");

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

    const { error: linkErr } = await supabaseAdmin
      .from("dispositivo_lista")
      .upsert({ dispositivo_id: dispositivoId, lista_id: data.lista_id }, { onConflict: 'dispositivo_id,lista_id' });

    if (linkErr) throw linkErr;

    if (targetCodeId) {
      await supabaseAdmin
        .from("codigos_ativacao")
        .update({ used_at: new Date().toISOString() })
        .eq("id", targetCodeId);
    }

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