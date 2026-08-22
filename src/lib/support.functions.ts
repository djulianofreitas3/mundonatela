import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getSupportStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("support_requests")
      .select("status");

    if (error) throw error;

    const stats = {
      new: data.filter((r) => r.status === "new").length,
      in_review: data.filter((r) => r.status === "in_review").length,
      completed: data.filter((r) => r.status === "completed").length,
      total: data.length,
    };

    return stats;
  });

const supportRequestSchema = z.object({
  id: z.string().optional(),
  status: z.enum(["new", "in_review", "completed", "added", "unavailable"]).optional(),
  admin_note: z.string().optional(),
  request_type: z.enum(["content_request", "problem_report"]).optional(),
  category: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  search: z.string().optional(),
  xtream_username: z.string().optional(),
});

export const getSupportRequests = createServerFn({ method: "GET" })
  .inputValidator((data) => supportRequestSchema.parse(data))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("support_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data.status) {
      query = query.eq("status", data.status);
    }
    if (data.request_type) {
      query = query.eq("request_type", data.request_type);
    }
    if (data.category) {
      query = query.eq("category", data.category);
    }
    if (data.search) {
      query = query.or(`content_name.ilike.%${data.search}%,title.ilike.%${data.search}%,description.ilike.%${data.search}%,device_name.ilike.%${data.search}%`);
    }

    const { data: requests, error } = await query;
    if (error) throw error;
    return requests;
  });

export const updateSupportRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    id: z.string(),
    status: z.enum(["new", "in_review", "completed", "added", "unavailable"]).optional(),
    admin_note: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    const { data: updated, error } = await supabaseAdmin
      .from("support_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const deleteSupportRequests = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    ids: z.array(z.string()),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("support_requests")
      .delete()
      .in("id", data.ids);

    if (error) throw error;
    return { success: true };
  });
