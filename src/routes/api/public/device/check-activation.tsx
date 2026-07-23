import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/public/device/check-activation")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const schema = z.object({
            installation_id: z.string(),
            activation_code: z.string(),
          });

          const { installation_id, activation_code } = schema.parse(body);

          const { data: device, error: deviceError } = await supabase
            .from("dispositivos")
            .select("status, device_token")
            .eq("installation_id", installation_id)
            .single();

          if (deviceError || !device) {
            return new Response(JSON.stringify({ error: "Device not found" }), { 
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }

          if (device.status === "active") {
            return new Response(JSON.stringify({
              status: "activated",
              device_token: device.device_token
            }), { headers: { "Content-Type": "application/json" } });
          }

          return new Response(JSON.stringify({
            status: "pending"
          }), { headers: { "Content-Type": "application/json" } });

        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
