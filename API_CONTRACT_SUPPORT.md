# Contrato da API Pública - Mundo na Tela

**URL Base de Produção:** `https://mundonatela.lovable.app`

---

## 1. Módulo de Ativação (Dispositivos)

Veja `API_CONTRACT_DEVICE.md` para o fluxo de registro, polling e check-in.

---

## 2. Módulo de Suporte e Solicitações

Utilizado para envio de pedidos de conteúdo e reporte de erros.

### A. Enviar Solicitação (POST)
- **Endpoint:** `POST /api/public/submit-support-request`
- **Headers:** 
  - `Content-Type: application/json`
  - `apikey: sb_publishable_8FzvfK5WftTxhf3kZOI6Tg_FhLigKcT`
- **Prevenção de Duplicidade:** O backend bloqueia envios repetidos do mesmo conteúdo para o mesmo `xtream_username` (categorias movie, series, channel). Retorna `409 Conflict` se duplicado.

**Exemplo: Pedido de Filme**
```json
{
  "request_type": "content_request",
  "category": "movie",
  "content_name": "Gladiador 2",
  "year": "2024",
  "xtream_username": "usuario123",
  "installation_id": "UUID-DO-DISPOSITIVO",
  "device_name": "Mi Box S"
}
```

**Exemplo: Reportar Problema em Série**
```json
{
  "request_type": "problem_report",
  "category": "series",
  "content_name": "Stranger Things",
  "series_id": "456",
  "season_number": 2,
  "episode_number": 5,
  "description": "Travando no minuto 15",
  "xtream_username": "usuario123",
  "installation_id": "UUID-DO-DISPOSITIVO"
}
```

### B. Consultar Histórico (GET)
Retorna os pedidos feitos pelo usuário atual.
- **Endpoint:** `GET /api/public/support-requests?xtream_username=usuario123&installation_id=UUID-DO-DISPOSITIVO`
- **Headers:** 
  - `apikey: sb_publishable_8FzvfK5WftTxhf3kZOI6Tg_FhLigKcT`
  - `Authorization: Bearer <device_token>` (Token obtido na ativação)
- **Retorno (200 OK):**
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

## 3. Mapeamento de Status (UI do App)

| Status no Backend | Label Sugerida |
| :--- | :--- |
| `new` | Novo |
| `in_review` | Em análise |
| `added` | Adicionado |
| `completed` | Concluído |
| `unavailable` | Não disponível |

---

## 4. Campos Adicionados (Banco de Dados)
Tabela: `support_requests`
- `xtream_username` (text)
- `content_id` (text)
- `series_id` (text)
- `season_number` (int4)
- `episode_id` (text)
- `episode_number` (int4)
