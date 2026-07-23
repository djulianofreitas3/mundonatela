import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/config")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: Config,
});


function Config() {
  return (
    <Layout title="Configurações">
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Página em construção</h2>
        <p className="text-muted-foreground mt-2">Esta página será implementada em breve.</p>
      </div>
    </Layout>
  );
}
