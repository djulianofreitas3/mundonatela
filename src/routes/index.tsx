import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Painel Administrativo IPTV</h1>
      <p>Bem-vindo ao sistema de gerenciamento de dispositivos e ativações.</p>
    </div>
  );
}
