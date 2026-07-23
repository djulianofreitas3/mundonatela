import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const registerDevice = createServerFn({ method: "POST" })
  .input(z.object({
    installation_id: z.string(),
    device_name: z.string().optional(),
    android_version: z.string().optional(),
    app_version: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { installation_id, device_name, android_version, app_version } = data;

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

    const { data: existingCode } = await supabase
      .from("codigos_ativacao")
      .select()
      .eq("installation_id", installation_id)
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .maybeSingle();

    if (existingCode) {
      return {
        activation_code: existingCode.code,
        expires_at: existingCode.expires_at
      };
    }

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

    return {
      activation_code: code,
      expires_at: expiresAt
    };
  });

export const Route = createFileRoute("/api/public/device/register")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const result = await registerDevice({ data: body });
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
