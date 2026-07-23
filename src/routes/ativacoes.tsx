import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Check, X, User, List } from "lucide-react";

export const Route = createFileRoute("/ativacoes")({
  component: PendingActivations,
});

function PendingActivations() {
  const [search, setSearch] = useState("");
  
  // Mock pending activations
  const activations = [
    {
      id: "1",
      code: "A7K9-3X2P",
      device_name: "Samsung S21",
      installation_id: "inst_001",
      requested_at: "2024-03-20T10:30:00Z",
      expires_in: "12:45",
    }
  ];

  return (
    <Layout title="Ativações Pendentes">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Pesquisar código de ativação..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Dispositivo</th>
                <th className="px-6 py-4">Solicitação</th>
                <th className="px-6 py-4">Tempo Restante</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activations.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-primary">{item.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{item.device_name}</div>
                    <div className="text-xs text-muted-foreground">{item.installation_id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(item.requested_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {item.expires_in}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Ativar">
                        <Check size={18} />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Rejeitar">
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground italic">
              Nenhuma ativação pendente no momento.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
