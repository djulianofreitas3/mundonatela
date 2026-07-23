import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/public/device/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const schema = z.object({
            device_token: z.string(),
            app_version: z.string().optional(),
          });

          const { device_token, app_version } = schema.parse(body);

          const { error } = await supabase
            .from("dispositivos")
            .update({
              last_seen_at: new Date().toISOString(),
              ...(app_version && { app_version })
            })
            .eq("device_token", device_token);

          if (error) throw error;

          return new Response(JSON.stringify({ status: "ok" }), { 
            headers: { "Content-Type": "application/json" } 
          });

        } catch (error: any) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { 
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
