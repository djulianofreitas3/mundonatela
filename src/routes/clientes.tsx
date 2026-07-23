import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Plus, MoreVertical, ShieldCheck, ShieldX } from "lucide-react";

export const Route = createFileRoute("/clientes")({
  component: Clients,
});

function Clients() {
  const [search, setSearch] = useState("");
  
  const clients = [
    {
      id: "1",
      nome: "João Silva",
      telefone: "(11) 98888-7777",
      status: "ativo",
      vencimento: "2024-12-31",
      dispositivos: 2
    }
  ];

  return (
    <Layout title="Clientes">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar clientes..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={18} />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Dispositivos</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{client.nome}</td>
                  <td className="px-6 py-4 text-sm">{client.telefone}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(client.vencimento).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">{client.dispositivos}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
