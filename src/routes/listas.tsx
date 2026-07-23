import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Search, Plus, MoreVertical, Trash2, Edit2, Link as LinkIcon, Globe, User, ShieldCheck, ShieldX, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLists, createList, testXtreamConnection } from "@/lib/lists.functions";
import { getClients } from "@/lib/clients.functions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const listSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  url: z.string().url("URL inválida"),
  usuario: z.string().min(1, "Usuário é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
  status: z.string().min(1, "Status é obrigatório"),
  cliente_id: z.string().uuid().optional(),
  vencimento: z.string().optional(),
});

type ListFormData = z.infer<typeof listSchema>;

export const Route = createFileRoute("/listas")({
  component: Lists,
});

function Lists() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const getListsFn = useServerFn(getLists);
  const getClientsFn = useServerFn(getClients);
  const createListFn = useServerFn(createList);
  const testConnectionFn = useServerFn(testXtreamConnection);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: () => getListsFn(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-brief"],
    queryFn: () => getClientsFn(),
  });

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: { status: "ativo" }
  });

  const createMutation = useMutation({
    mutationFn: (data: ListFormData) => createListFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setIsModalOpen(false);
      reset();
    },
  });

  const testMutation = useMutation({
    mutationFn: (data: any) => testConnectionFn({ data }),
    onSuccess: (result) => {
      setTestResult(result);
    },
    onSettled: () => {
      setTestingId(null);
    }
  });

  const handleTest = (list: any) => {
    setTestingId(list.id);
    setTestResult(null);
    testMutation.mutate({
      url: list.url,
      username: list.usuario,
      password: list.senha
    });
  };

  const onSubmit = (data: ListFormData) => {
    createMutation.mutate(data);
  };

  const filteredLists = Array.isArray(lists) ? lists.filter((l: any) => 
    l.nome.toLowerCase().includes(search.toLowerCase()) || 
    l.usuario.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <Layout title="Listas Xtream">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar listas..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            reset();
            setTestResult(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span>Nova Lista</span>
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
                  <th className="px-6 py-4">Nome / Servidor</th>
                  <th className="px-6 py-4">Credenciais</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLists.map((list: any) => (
                  <tr key={list.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{list.nome}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe size={12} />
                        {list.url}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-muted-foreground" />
                        {list.usuario}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        ********
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {list.cliente?.nome || <span className="text-muted-foreground italic">Não vinculado</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        list.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {list.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleTest(list)}
                          disabled={testingId === list.id}
                          className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-1"
                        >
                          {testingId === list.id ? <Loader2 size={14} className="animate-spin" /> : "Testar Conexão"}
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      {testingId === list.id && (
                        <div className="absolute mt-1 text-[10px] text-primary animate-pulse">Testando...</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLists.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">Nenhuma lista encontrada.</div>
            )}
          </div>
        </div>
      )}

      {/* Connection Test Overlay Notification */}
      {testResult && (
        <div className="fixed bottom-4 right-4 z-[100] bg-card border border-border shadow-2xl rounded-lg p-4 max-w-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            {testResult.success ? <CheckCircle2 className="text-green-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
            <div className="flex-1">
              <h4 className="font-bold text-sm">{testResult.success ? "Conexão OK" : "Erro de Conexão"}</h4>
              <p className="text-xs text-muted-foreground mt-1">{testResult.message}</p>
              {testResult.info && (
                <div className="mt-2 p-2 bg-muted rounded text-[10px] font-mono">
                  Exp: {testResult.info.exp_date ? format(new Date(parseInt(testResult.info.exp_date) * 1000), "dd/MM/yyyy") : "N/A"}
                </div>
              )}
            </div>
            <button onClick={() => setTestResult(null)} className="text-muted-foreground hover:text-foreground">
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Nova Lista Xtream</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nome Identificador *</label>
                  <input 
                    {...register("nome")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="Ex: Servidor VIP 1"
                  />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">URL do Servidor *</label>
                  <input 
                    {...register("url")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="http://exemplo.com:8080"
                  />
                  {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usuário *</label>
                  <input 
                    {...register("usuario")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                  {errors.usuario && <p className="text-red-500 text-xs mt-1">{errors.usuario.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Senha *</label>
                  <input 
                    type="password"
                    {...register("senha")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                  {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vincular Cliente</label>
                  <select 
                    {...register("cliente_id")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">Nenhum</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimento</label>
                  <input 
                    type="date"
                    {...register("vencimento")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
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
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Cadastrar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
