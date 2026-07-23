import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Plus, MoreVertical, Trash2, Edit2, ShieldCheck, ShieldX, Phone, Calendar, Info, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients, createClient, deleteClient, updateClient } from "@/lib/clients.functions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const clientSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().optional(),
  observacao: z.string().optional(),
  vencimento: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório"),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const Route = createFileRoute("/clientes")({
  component: Clients,
});

function Clients() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => getClients(),
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsModalOpen(false);
      setEditingClient(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (confirm("Tem certeza que deseja excluir este cliente?")) {
        return deleteClient(id);
      }
      throw new Error("Cancelado");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredClients = clients.filter((c: any) => 
    c.nome.toLowerCase().includes(search.toLowerCase()) || 
    (c.telefone && c.telefone.includes(search))
  );

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
        <button 
          onClick={() => {
            setEditingClient(null);
            reset({ nome: "", telefone: "", observacao: "", status: "ativo", vencimento: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4 text-center">Disp.</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{client.nome}</div>
                      {client.observacao && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{client.observacao}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {client.telefone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-muted-foreground" />
                          {client.telefone}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {client.vencimento ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-muted-foreground" />
                          {format(new Date(client.vencimento), "dd/MM/yyyy")}
                        </div>
                      ) : "Sem data"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {client.dispositivos?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingClient(client);
                            reset({
                              nome: client.nome,
                              telefone: client.telefone || "",
                              observacao: client.observacao || "",
                              status: client.status || "ativo",
                              vencimento: client.vencimento ? client.vencimento.split('T')[0] : ""
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-blue-600"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteMutation.mutate(client.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">Nenhum cliente encontrado.</div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6">{editingClient ? "Editar Cliente" : "Novo Cliente"}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input 
                  {...register("nome")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="Nome completo"
                />
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input 
                    {...register("telefone")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimento</label>
                  <input 
                    type="date"
                    {...register("vencimento")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  {...register("status")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ativo">Ativo</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observação</label>
                <textarea 
                  {...register("observacao")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Informações adicionais..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={16} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
