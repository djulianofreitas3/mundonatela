import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const codeRequestTimes = new Map<string, number>();
function createNumericCode() {
  const range = 900_000;
  const ceiling = Math.floor(0x1_0000_0000 / range) * range;
  const sample = new Uint32Array(1);
  do { crypto.getRandomValues(sample); } while (sample[0] >= ceiling);
  return String(100_000 + (sample[0] % range));
}

export const Route = createFileRoute("/api/public/device/request-code")({
  component: () => null,
  loader: () => {
    throw new Error("This is a server-only API route");
  },
});

// @ts-ignore
Route.options.server = {
  handlers: {
    POST: async ({ request }: { request: Request }) => {
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const body = await request.json();

        const schema = z.object({
          installation_id: z.string().min(5),
        });

        const result = schema.safeParse(body);

        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: "Invalid input",
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        }

        const { installation_id } = result.data;

        // Limita a emissão a um código por aparelho a cada 45 segundos.
        const lastRequest = codeRequestTimes.get(installation_id) ?? 0;
        if (Date.now() - lastRequest < 45_000) {
          return new Response(JSON.stringify({ error: "Aguarde alguns segundos antes de gerar outro código." }), { status: 429 });
        }

        // 1. Confirmar que o dispositivo existe
        const { data: device, error: devErr } = await supabaseAdmin
          .from("dispositivos")
          .select("id, status")
          .eq("installation_id", installation_id)
          .single();

        if (devErr || !device) {
          return new Response(
            JSON.stringify({
              error: "Device not registered",
            }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        }

        if (["blocked", "revoked"].includes(device.status)) {
          return new Response(JSON.stringify({ error: "Este dispositivo está bloqueado. Procure o responsável pela ativação." }), { status: 403 });
        }

        /*
         * 2. Remover códigos pendentes anteriores deste mesmo aparelho.
         *
         * Não mexemos em códigos já utilizados, porque eles podem
         * continuar servindo como histórico.
         *
         * Resultado:
         * cada installation_id terá no máximo 1 código pendente.
         */
        const { data: recentCodes, error: recentErr } = await supabaseAdmin
          .from("codigos_ativacao")
          .select("id, created_at")
          .eq("installation_id", installation_id)
          .is("used_at", null)
          .order("created_at", { ascending: false })
          .limit(1);

        if (recentErr) throw recentErr;
        const newestPending = recentCodes?.[0];
        if (newestPending && Date.now() - Date.parse(newestPending.created_at) < 45_000) {
          return new Response(JSON.stringify({ error: "Aguarde alguns segundos antes de gerar outro código." }), { status: 429 });
        }

        const { error: cleanupErr } = await supabaseAdmin
          .from("codigos_ativacao")
          .delete()
          .eq("installation_id", installation_id)
          .is("used_at", null);
        if (cleanupErr) throw cleanupErr;

        const expiresAt = new Date(
          Date.now() + 15 * 60 * 1000,
        ).toISOString();

        // Six numeric digits from a cryptographic RNG; retry on unique collision.
        let code = "";
        let newCode: any = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          code = createNumericCode();
          const { data, error } = await supabaseAdmin
            .from("codigos_ativacao")
            .insert({ code, installation_id, expires_at: expiresAt })
            .select("request_id, poll_token")
            .single();
          if (!error && data) {
            newCode = data;
            break;
          }
          if (error?.code !== "23505") throw error;
        }
        if (!newCode) throw new Error("Não foi possível gerar o código. Tente novamente.");
        codeRequestTimes.set(installation_id, Date.now());

        return new Response(
          JSON.stringify({
            success: true,
            code,
            request_id: newCode.request_id,
            poll_token: newCode.poll_token,
            expires_at: expiresAt,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      } catch (err: any) {
        console.error("[request-code] Falha ao criar solicitação de ativação.");

        return new Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
    },
  },
};
