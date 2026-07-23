import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admins")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: Admins,
});


function Admins() {
  return (
    <Layout title="Administradores">
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Página em construção</h2>
        <p className="text-muted-foreground mt-2">Esta página será implementada em breve.</p>
      </div>
    </Layout>
  );
}
