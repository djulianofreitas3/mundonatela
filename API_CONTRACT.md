# Contrato da API Pública - Mundo na Tela

**URL Base de Produção:** `https://mundonatela.lovable.app`

---

## 1. Módulo de Ativação (Dispositivos)
Consulte `API_CONTRACT_DEVICE.md` para o fluxo detalhado de registro e check-in.

---

## 2. Módulo de Suporte e Solicitações

### A. Enviar Solicitação (POST)
- **Endpoint:** `POST /api/public/submit-support-request`
- **Headers:** 
  - `Content-Type: application/json`
  - `apikey: sb_publishable_8FzvfK5WftTxhf3kZOI6Tg_FhLigKcT`
- **Token de Dispositivo:** Não obrigatório no POST, mas recomendado enviar `installation_id` para rastreio.

**Estrutura JSON - Pedido de Filme:**
```json
{
  "request_type": "content_request",
  "category": "movie",
  "content_name": "Gladiador 2",
  "year": "2024",
  "xtream_username": "usuario_teste",
  "installation_id": "UUID-UNICO",
  "device_name": "Xiaomi Mi Box"
}
```

**Estrutura JSON - Pedido de Série:**
```json
{
  "request_type": "content_request",
  "category": "series",
  "content_name": "Stranger Things",
  "series_id": "456",
  "season_number": 5,
  "xtream_username": "usuario_teste",
  "installation_id": "UUID-UNICO"
}
```

**Estrutura JSON - Pedido de Canal:**
```json
{
  "request_type": "content_request",
  "category": "channel",
  "content_name": "Globo RJ HD",
  "xtream_username": "usuario_teste",
  "installation_id": "UUID-UNICO"
}
```

**Estrutura JSON - Reportar Problema:**
```json
{
  "request_type": "problem_report",
  "category": "movie",
  "content_name": "Batman",
  "description": "O filme está travando aos 20 minutos.",
  "xtream_username": "usuario_teste",
  "installation_id": "UUID-UNICO",
  "content_id": "123"
}
```

**Campos de Metadados:**
- `content_id`: ID do conteúdo no provedor.
- `series_id`: ID da série (para categorias series).
- `season_number`: Número da temporada (inteiro).
- `episode_id`: ID do episódio.
- `episode_number`: Número do episódio (inteiro).

**Respostas do POST:**
- **Sucesso (201 Created):** `{"success": true, "id": "uuid-da-solicitacao"}`
- **Duplicidade (409 Conflict):** `{"success": false, "error": "duplicate_request", "message": "Este pedido já foi realizado."}`
- **Erro de Input (400 Bad Request):** Quando faltam campos obrigatórios ou o JSON é inválido.
- **Erro Interno (500 Internal Server Error):** Falha no banco de dados.

---

### B. Consultar Histórico de Pedidos (GET)
- **Endpoint:** `GET /api/public/support-requests?xtream_username=usuario123&installation_id=UUID-UNICO`
- **Método:** `GET`
- **Headers Obrigatórios:**
  - `apikey: sb_publishable_8FzvfK5WftTxhf3kZOI6Tg_FhLigKcT`
  - `Authorization: Bearer <device_token>`
- **Segurança:** O backend valida o `device_token` contra o `installation_id`. O usuário só consegue visualizar pedidos vinculados ao seu `xtream_username`.
- **Identificação:** O `xtream_username` deve ser passado na Query String para filtro, mas a permissão de acesso é validada pelo Token Bearer.

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "request_type": "content_request",
      "category": "movie",
      "content_name": "Gladiador 2",
      "status": "in_review",
      "admin_note": "Estamos processando seu pedido.",
      "created_at": "2024-03-20T10:00:00Z"
    }
  ]
}
```

---

## 3. Tabela de Status e Erros

| Código HTTP | Significado | Contexto |
| :--- | :--- | :--- |
| **200/201** | OK | Sucesso na operação. |
| **400** | Bad Request | JSON inválido ou campos mal formatados. |
| **401** | Unauthorized | Token Bearer ausente ou mal formado. |
| **403** | Forbidden | Token de dispositivo inválido para o installation_id informado. |
| **409** | Conflict | Pedido duplicado (mesmo usuário + mesmo conteúdo + status ativo). |
| **500** | Server Error | Erro inesperado no servidor. |

**Valores possíveis de `status`:**
- `new`: Novo pedido recebido.
- `in_review`: Em análise pela equipe.
- `added`: Conteúdo adicionado ao sistema.
- `completed`: Solicitação finalizada.
- `unavailable`: Conteúdo não encontrado ou indisponível.
