# Plano de Expansão: Módulo de Solicitações e Suporte - Mundo na Tela

Este plano detalha a implementação das novas funcionalidades para o sistema de suporte, incluindo identificação de usuário Xtream, histórico personalizado, prevenção de duplicidade e melhorias no painel administrativo.

## Mudanças Técnicas

### 1. Banco de Dados (Supabase)
- **Tabela `support_requests`**:
    - `xtream_username`: Identificador da conta Xtream (texto).
    - Campos de conteúdo detalhado: `content_id`, `series_id`, `season_number`, `episode_id`, `episode_number`.
- **RLS (Row Level Security)**:
    - Política para permitir que dispositivos consultem apenas suas próprias solicitações baseadas em `installation_id` e validando o `device_token`.

### 2. Backend (Server Functions & API Routes)
- **`submit-support-request.ts` (POST)**:
    - Atualização para aceitar `xtream_username` e novos campos de conteúdo.
    - Implementação de lógica de normalização (lowercase + trim) para o nome do conteúdo.
    - **Bloqueio de Duplicidade**: Antes de inserir, verifica se o mesmo `xtream_username` já possui um pedido ativo para o mesmo conteúdo (nas categorias Filme, Série ou Canal). Retorna `409 Conflict` em caso de duplicata.
- **`support-requests.ts` (Novo GET)**:
    - Rota pública segura: `/api/public/support-requests`.
    - Filtra por `xtream_username`.
    - Exige validação de segurança via `installation_id` e `Authorization: Bearer <device_token>` para garantir que um usuário não acesse dados de outro.
- **`support.functions.ts`**:
    - Atualização dos esquemas Zod e das funções administrativas para incluir o novo campo de usuário nos filtros e na listagem.

### 3. Painel Administrativo (Frontend)
- **Página de Solicitações**:
    - Nova coluna "USUÁRIO" na tabela principal.
    - Exibição do `xtream_username` no modal de detalhes.
    - Exibição clara dos novos campos de conteúdo (Temporada/Episódio) quando aplicável.
    - Tratamento de pedidos antigos (exibir "Não identificado" quando `xtream_username` for nulo).

## Detalhes de Segurança e Normalização
- **Normalização**: `Gladiador 2` e `gladiador 2` serão tratados como o mesmo pedido através de comparação case-insensitive e remoção de espaços extras.
- **Privacidade**: O sistema nunca armazenará senhas ou URLs privadas da lista Xtream, apenas o nome de usuário.
- **Acesso ao Histórico**: O aplicativo deve enviar o `device_token` gerado na ativação para autorizar a consulta ao histórico de pedidos daquela instalação.

## Próximos Passos
1. Atualizar esquemas Zod nos arquivos de funções e rotas.
2. Implementar a lógica de prevenção de duplicidade no endpoint de submissão.
3. Criar a nova rota de consulta de histórico.
4. Refatorar a UI da página de solicitações para incluir as novas colunas e campos.
5. Validar o contrato da API com exemplos práticos.