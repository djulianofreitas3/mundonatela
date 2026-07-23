import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Plus, MoreVertical, ShieldCheck, ShieldX, RefreshCw, Unlink } from "lucide-react";

export const Route = createFileRoute("/dispositivos")({
  component: Devices,
});

function Devices() {
  const [search, setSearch] = useState("");
  
  const devices = [
    {
      id: "1",
      code: "A7K9-3X2P",
      nome: "Samsung S21",
      cliente: "João Silva",
      status: "ativo",
      vencimento: "2024-12-31"
    }
  ];

  return (
    <Layout title="Dispositivos">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar dispositivos..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Aparelho</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-primary">{device.code}</td>
                  <td className="px-6 py-4 font-medium">{device.nome}</td>
                  <td className="px-6 py-4">{device.cliente}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(device.vencimento).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Bloquear"><ShieldX size={18} /></button>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Renovar"><RefreshCw size={18} /></button>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Desvincular"><Unlink size={18} /></button>
                    </div>
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
