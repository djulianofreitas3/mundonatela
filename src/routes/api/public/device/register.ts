import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/public/device/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const schema = z.object({
            installation_id: z.string(),
            device_name: z.string().optional(),
            android_version: z.string().optional(),
            app_version: z.string().optional(),
          });

          const { installation_id, device_name, android_version, app_version } = schema.parse(body);

          // Get or create device
          const { data: device, error: deviceError } = await supabase
            .from("dispositivos")
            .upsert(
              {
                installation_id,
                device_name,
                android_version,
                app_version,
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "installation_id" }
            )
            .select()
            .single();

          if (deviceError) throw deviceError;

          // Check if active code already exists and is valid
          const { data: existingCode } = await supabase
            .from("codigos_ativacao")
            .select()
            .eq("installation_id", installation_id)
            .gt("expires_at", new Date().toISOString())
            .is("used_at", null)
            .maybeSingle();

          if (existingCode) {
            return new Response(JSON.stringify({
              activation_code: existingCode.code,
              expires_at: existingCode.expires_at
            }), { headers: { "Content-Type": "application/json" } });
          }

          // Generate new code: 8 chars alphanumeric like A7K9-3X2P
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          const genPart = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
          const code = `${genPart()}-${genPart()}`;

          const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

          const { error: codeError } = await supabase
            .from("codigos_ativacao")
            .insert({
              code,
              installation_id,
              expires_at: expiresAt
            });

          if (codeError) throw codeError;

          return new Response(JSON.stringify({
            activation_code: code,
            expires_at: expiresAt
          }), { headers: { "Content-Type": "application/json" } });

        } catch (error: any) {
          console.error("Register error:", error);
          return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
