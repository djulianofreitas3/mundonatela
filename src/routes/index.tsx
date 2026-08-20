// Quero adicionar ao painel administrativo do Mundo na Tela um sistema completo de Solicitações e Suporte, integrado ao Supabase.
// 
// A ideia é que futuramente o aplicativo Mundo na Tela envie diretamente para o painel:
// 
//  pedidos de Filmes;
// 
//  pedidos de Séries;
// 
//  pedidos de Canais;
// 
//  outros pedidos de conteúdo;
// 
//  relatos de problemas/erros do aplicativo.
// 
// Quero que você implemente agora a parte do painel administrativo, banco de dados e backend necessário para receber essas solicitações.
// 
// IMPORTANTE: não alterar as funcionalidades já existentes do painel. Apenas adicionar esse novo módulo.
// 
// 1. NOVA ABA NO MENU
// 
// Adicione uma nova opção no menu lateral:
// 
// Solicitações
// 
// Use um ícone relacionado a:
// 
//  mensagem;
// 
//  suporte;
// 
//  inbox;
// 
//  ticket.
// 
// Quando existirem solicitações com status novo, mostrar um contador no menu.
// 
// Exemplo:
// 
// Solicitações 🔴 4
// 
// Esse contador deve atualizar automaticamente quando chegar uma nova solicitação.
// 
// 2. DASHBOARD DA ABA SOLICITAÇÕES
// 
// Ao entrar em Solicitações, quero no topo pequenos cards:
// 
// Novas
// 
// Em análise
// 
// Concluídas
// 
// Total
// 
// Exemplo:
// 
// Novas: 6
// 
// Em análise: 3
// 
// Concluídas: 27
// 
// Total: 36
// 
// 3. SEPARAR EM DOIS TIPOS
// 
// Dentro da página quero duas abas:
// 
// Pedidos de Conteúdo
// 
// Para:
// 
//  Filme
// 
//  Série
// 
//  Canal
// 
//  Outro
// 
// Reportar Problema
// 
// Para:
// 
//  Canais
// 
//  Filmes
// 
//  Séries
// 
//  Player
// 
//  Favoritos
// 
//  Multitela
// 
//  Login / Ativação
// 
//  Atualização
// 
//  Outro
// 
// Também quero uma opção:
// 
// Todos
// 
// 4. LISTAGEM
// 
// Mostrar as solicitações em uma tabela moderna.
// 
// Colunas:
// 
// Status
// 
// Tipo
// 
// Categoria
// 
// Solicitação
// 
// Dispositivo
// 
// Versão App
// 
// Data/Hora
// 
// Ações
// 
// Exemplo:
// 
// 🔴 Novo | Pedido | Filme | Gladiador 2 | Mi Box | 2.5.13 | 20/08 09:30
// 
// Outro exemplo:
// 
// 🔴 Novo | Problema | Player | Filme fecha ao reproduzir | Philips TV | 2.5.13 | 20/08 09:32
// 
// 5. STATUS
// 
// Quero conseguir alterar o status de cada solicitação.
// 
// Para qualquer solicitação:
// 
// Novo
// 
// Em análise
// 
// Concluído
// 
// Para pedidos de conteúdo, adicionar também:
// 
// Adicionado
// 
// Não disponível
// 
// Usar cores diferentes:
// 
//  Novo = vermelho/rosa;
// 
//  Em análise = amarelo;
// 
//  Concluído = verde;
// 
//  Adicionado = verde;
// 
//  Não disponível = cinza/vermelho discreto.
// 
// 6. DETALHES DA SOLICITAÇÃO
// 
// Ao clicar em uma solicitação, abrir um painel lateral ou modal com todas as informações.
// 
// Para Pedido de Conteúdo, mostrar:
// 
//  Tipo do pedido;
// 
//  Filme/Série/Canal/Outro;
// 
//  Nome do conteúdo;
// 
//  Ano, se informado;
// 
//  Temporada, se informada;
// 
//  Cidade/Estado, se for canal;
// 
//  Observação;
// 
//  Data e hora;
// 
//  Informações do dispositivo.
// 
// Para Relato de Problema, mostrar:
// 
//  Área do problema;
// 
//  Título;
// 
//  Descrição;
// 
//  Nome do conteúdo/canal, se informado;
// 
//  Versão do aplicativo;
// 
//  VersionCode;
// 
//  Tipo do dispositivo;
// 
//  Fabricante;
// 
//  Modelo;
// 
//  Android;
// 
//  Data e hora.
// 
// 7. NOTAS INTERNAS
// 
// Dentro de cada solicitação quero um campo:
// 
// Observação interna
// 
// Essa informação é somente para o administrador.
// 
// Exemplo:
// 
// Testado na version 2.5.13. Problema confirmado.
// 
// Permitir salvar essa observação no banco.
// 
// 8. FILTROS E PESQUISA
// 
// Adicione filtros por:
// 
//  Novo;
// 
//  Em análise;
// 
//  Concluído;
// 
//  Pedido de conteúdo;
// 
//  Reportar problema;
// 
//  Filme;
// 
//  Série;
// 
//  Canal;
// 
//  Player;
// 
//  data.
// 
// Também quero uma barra de pesquisa.
// 
// A busca deve encontrar pelo menos:
// 
//  nome do conteúdo;
// 
//  título;
// 
//  descrição;
// 
//  dispositivo.
// 
// 9. ORDEM
// 
// Por padrão mostrar:
// 
// mais recentes primeiro
// 
// e priorizar visualmente solicitações com status:
// 
// Novo
// 
// 10. BANCO DE DADOS SUPABASE
// 
// Crie uma tabela chamada:
// 
// support_requests
// 
// Estrutura sugerida:
// 
// id uuid primary key default gen_random_uuid()
// 
// created_at timestamptz default now()
// 
// request_type text
// 
// Valores:
// 
// content_request
// 
// problem_report
// 
// category text
// 
// Exemplos:
// 
// movie
// 
// series
// 
// channel
// 
// player
// 
// favorites
// 
// multiscreen
// 
// activation
// 
// update
// 
// other
// 
// Adicione:
// 
// title text
// 
// description text
// 
// content_name text
// 
// year text
// 
// season text
// 
// city_state text
// 
// device_id text
// 
// installation_id text
// 
// device_name text
// 
// device_manufacturer text
// 
// device_model text
// 
// device_type text
// 
// android_version text
// 
// app_version text
// 
// version_code integer
// 
// status text default 'new'
// 
// admin_note text
// 
// updated_at timestamptz
// 
// 11. STATUS NO BANCO
// 
// Utilizar valores internos consistentes:
// 
// new
// 
// in_review
// 
// completed
// 
// added
// 
// unavailable
// 
// Na interface mostrar em português:
// 
// new → Novo
// 
// in_review → Em análise
// 
// completed → Concluído
// 
// added → Adicionado
// 
// unavailable → Não disponível
// 
// 12. SEGURANÇA
// 
// Não deixar a tabela support_requests aberta para leitura pública.
// 
// O aplicativo futuramente poderá enviar solicitações, mas não deve ter acesso público para:
// 
//  ler solicitações de outros usuários;
// 
//  editar;
// 
//  excluir;
// 
//  visualizar notas administrativas.
// 
// O painel administrativo deve possuir acesso para:
// 
//  listar;
// 
//  visualizar;
// 
//  alterar status;
// 
//  adicionar notas.
// 
// Não expor service_role ou chaves secretas no frontend.
// 
// 13. ENDPOINT PARA O APLICATIVO
// 
// Deixe também preparado um endpoint/Edge Function do Supabase chamado, por exemplo:
// 
// submit-support-request
// 
// Esse endpoint será utilizado depois pelo aplicativo Android para enviar as solicitações.
// 
// Ele deve aceitar somente os campos necessários.
// 
// Não permitir que o aplicativo envie:
// 
//  status;
// 
//  admin_note;
// 
//  campos administrativos.
// 
// Ao receber uma solicitação válida:
// 
// salvar automaticamente:
// 
// status = new
// 
// created_at = now()
// 
// E retornar algo simples:
// 
// success: true
// 
// e o ID da solicitação.
// 
// Se o aplicativo já possuir device_token ou identificação do dispositivo, aproveite a infraestrutura existente e valide o dispositivo sempre que possível.
// 
// 14. TEMPO REAL
// 
// Quero utilizar Supabase Realtime para essa tabela.
// 
// Quando uma nova solicitação entrar:
// 
//  atualizar a lista automaticamente;
// 
//  atualizar o contador de Novas;
// 
//  não precisar atualizar a página manualmente.
// 
// Se possível, mostrar uma notificação discreta:
// 
// Nova solicitação recebida
// 
// 15. DASHBOARD PRINCIPAL
// 
// Se não atrapalhar o layout atual, adicionar também no Dashboard principal um pequeno card:
// 
// Solicitações novas
// 
// mostrando a quantidade.
// 
// Ao clicar, abrir a aba Solicitações filtrada por:
// 
// status = new
// 
// 16. AÇÕES
// 
// Dentro de uma solicitação permitir:
// 
// Marcar Em análise
// 
// Marcar Concluído
// 
// Para pedidos de conteúdo:
// 
// Marcar Adicionado
// 
// Marcar Não disponível
// 
// Evite exclusão permanente como ação principal.
// 
// Se for necessário remover da visualização, prefira futuramente um sistema de arquivamento.
// 
// 17. RESPONSIVIDADE
// 
// Essa nova área precisa funcionar corretamente em:
// 
//  computador;
// 
//  tablet;
// 
//  celular.
// 
// No desktop utilizar tabela.
// 
// No celular pode transformar cada solicitação em cards para facilitar a leitura.
// 
// 18. NÃO ALTERAR
// 
// Não modificar nenhuma funcionalidade existente do painel que não seja necessária para esta implementação.
// 
// Quero somente adicionar o novo módulo de Solicitações e Suporte, integrado ao Supabase.
// 
// Antes de finalizar:
// 
//  crie alguns registros de teste;
// 
//  confirme que aparecem no painel;
// 
//  confirme que o contador de novas funciona;
// 
//  teste alteração de status;
// 
//  teste notas internas;
// 
//  teste filtros e pesquisa;
// 
//  teste recebimento em tempo real;
// 
//  confirme que usuários públicos não conseguem consultar a tabela.
// 
// Ao concluir, me informe:
// 
//  nome da tabela criada;
// 
//  campos;
// 
//  policies/RLS criadas;
// 
//  nome e URL/rota da Edge Function;
// 
//  formato JSON esperado para o aplicativo enviar;
// 
//  exemplo de requisição;
// 
//  exemplo da resposta.
// 
// Não faça ainda alterações no aplicativo Android. Quero primeiro deixar o painel e o backend completamente prontos. (on element 'body' at '/src/routes/index.tsx:1')




import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/layout/Layout";
import { Users, Monitor, Clock, Calendar, ShieldAlert, List, Loader2, History, Plus, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ActivationModal } from "@/components/ActivationModal";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const getStatsFn = useServerFn(getDashboardStats);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getStatsFn(),
    refetchInterval: 30000 // Refresh every 30s
  });

  const iconMap: Record<string, any> = {
    "Clientes Ativos": Users,
    "Dispositivos Ativos": Monitor,
    "Ativações Pendentes": Clock,
    "Vencidos": Calendar,
    "Bloqueados": ShieldAlert,
    "Listas Ativas": List,
    "Solicitações Novas": MessageSquare,
  };

  return (
    <Layout title="Dashboard">
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.stats.map((stat: any, i: number) => {
              const Icon = iconMap[stat.label] || Monitor;
              return (
                <div key={i} className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History size={20} className="text-primary" />
                Histórico Recente
              </h3>
              <div className="space-y-4">
                {data?.recentActivations.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum registro recente.</p>
                ) : (
                  data?.recentActivations.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{(item.dispositivo as any)?.device_name || "Dispositivo"}</span>
                        <span className="text-xs text-muted-foreground">{(item.cliente as any)?.nome || "Sem cliente"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] block font-mono text-muted-foreground">{format(new Date(item.created_at), "dd/MM HH:mm")}</span>
                        <span className={`text-[10px] uppercase font-bold ${item.action === 'activation' ? 'text-green-600' : 'text-blue-600'}`}>
                          {item.action}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsActivationModalOpen(true)}
                  className="p-4 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-center"
                >
                  <Plus className="mx-auto mb-2 text-primary" size={24} />
                  <span className="text-xs font-bold text-primary uppercase">Ativar Novo</span>
                </button>
                <a href="/clientes" className="p-4 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors text-center">
                  <Users className="mx-auto mb-2 text-green-600" size={24} />
                  <span className="text-xs font-bold text-green-600 uppercase">Novo Cliente</span>
                </a>
                <a href="/listas" className="p-4 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors text-center">
                  <List className="mx-auto mb-2 text-purple-600" size={24} />
                  <span className="text-xs font-bold text-purple-600 uppercase">Nova Lista</span>
                </a>
                <Link to="/dispositivos" className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-center">
                  <Monitor className="mx-auto mb-2 text-gray-600" size={24} />
                  <span className="text-xs font-bold text-gray-600 uppercase">Ver Dispositivos</span>
                </Link>
                <Link to="/solicitacoes" search={{ status: 'new' }} className="p-4 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors text-center">
                  <MessageSquare className="mx-auto mb-2 text-rose-600" size={24} />
                  <span className="text-xs font-bold text-rose-600 uppercase">Solicitações Novas</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      <ActivationModal 
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
      />
    </Layout>
  );
}
