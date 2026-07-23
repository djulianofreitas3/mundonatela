import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";

export const Route = createFileRoute("/historico")({
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <Layout title="Histórico de Ações">
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Página em construção</h2>
        <p className="text-muted-foreground mt-2">Esta página será implementada em breve.</p>
      </div>
    </Layout>
  );
}
