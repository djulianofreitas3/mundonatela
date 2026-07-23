import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getClients = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("clientes")
      .select(`
        *,
        dispositivos:dispositivos(count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createClient = createServerFn({ method: "POST" })
  .input(
    z.object({
      nome: z.string().min(1, "Nome é obrigatório"),
      telefone: z.string().optional(),
      observacao: z.string().optional(),
      status: z.string().default("ativo"),
      vencimento: z.string().optional(),
    })
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("clientes")
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const updateClient = createServerFn({ method: "POST" })
  .input(
    z.object({
      id: z.string().uuid(),
      nome: z.string().optional(),
      telefone: z.string().optional(),
      observacao: z.string().optional(),
      status: z.string().optional(),
      vencimento: z.string().optional(),
    })
  )
  .handler(async ({ data: { id, ...input } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("clientes")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const deleteClient = createServerFn({ method: "POST" })
  .input(z.string().uuid())
  .handler(async ({ data: id }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("clientes").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  });
