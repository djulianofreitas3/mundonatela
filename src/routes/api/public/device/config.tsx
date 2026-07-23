import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/public/device/config")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { device_token } = z.object({ device_token: z.string() }).parse(body);

          const { data: device, error: deviceError } = await supabase
            .from("dispositivos")
            .select(`
              id,
              status,
              expires_at,
              dispositivo_lista (
                listas_iptv (
                  nome,
                  url,
                  usuario,
                  senha
                )
              )
            `)
            .eq("device_token", device_token)
            .single();

          if (deviceError || !device) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }

          if (device.status !== "active") {
            return new Response(JSON.stringify({ 
              status: device.status,
              message: "Device is not active" 
            }), { headers: { "Content-Type": "application/json" } });
          }

          const config = device.dispositivo_lista?.[0]?.listas_iptv;

          return new Response(JSON.stringify({
            status: device.status,
            expires_at: device.expires_at,
            xtream_config: config ? {
              url: config.url,
              username: config.usuario,
              password: config.senha
            } : null
          }), { headers: { "Content-Type": "application/json" } });

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
