# Contrato da API Pública - Mundo na Tela

**URL Base de Produção:** `https://mundonatela.lovable.app`
**URL Base de Desenvolvimento:** `https://ccc9c726-0c84-4d1a-af25-d0dd92838866.lovableproject.com`

---

## 1. Registro de Dispositivo
Utilizado no primeiro acesso do aplicativo ou após desinstalação. O `installation_id` deve ser um UUID gerado localmente pelo app.

- **Endpoint:** `POST /api/public/device/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "installation_id": "UUID-GERADO-PELO-APP",
  "device_name": "Xiaomi Mi Box S",
  "android_version": "9.0",
  "app_version": "1.0.4"
}
```
- **Retorno (200 OK):**
```json
{
  "success": true,
  "device_id": "UUID-INTERNO",
  "status": "pending"
}
```

---

## 2. Solicitar Código de Ativação
Gera o código de 6 dígitos para exibição na tela do aparelho.

- **Endpoint:** `POST /api/public/device/request-code`
- **Body:**
```json
{
  "installation_id": "UUID-GERADO-PELO-APP"
}
```
- **Retorno (200 OK):**
```json
{
  "success": true,
  "code": "ABC123",
  "request_id": "UUID-DA-SOLICITACAO",
  "poll_token": "TOKEN-SECRETO-DE-CONSULTA",
  "expires_at": "ISO-TIMESTAMP"
}
```

---

## 3. Polling de Status
O app deve consultar este endpoint a cada 5-10 segundos enquanto exibe o código.

- **Endpoint:** `POST /api/public/device/poll`
- **Body:**
```json
{
  "request_id": "UUID-DA-SOLICITACAO",
  "poll_token": "TOKEN-SECRETO-DE-CONSULTA"
}
```
- **Respostas Possíveis:**
  - `{"status": "pending"}`: Ainda aguardando aprovação no painel.
  - `{"status": "approved", "device_token": "UUID-TOKEN-ATIVACAO"}`: Sucesso! Guardar o `device_token` localmente.
  - `{"status": "rejected"}`: Administrador negou a solicitação.
  - `{"status": "expired"}`: O código de 15 minutos expirou.
  - `{"status": "blocked"}`: Dispositivo bloqueado pelo administrador.

---

## 4. Obter Configuração (Check)
Utilizado em cada abertura do aplicativo para obter os dados da lista Xtream.

- **Endpoint:** `POST /api/public/device/check`
- **Opção A (Body):** `{"installation_id": "...", "device_token": "..."}`
- **Opção B (Header - Recomendado):** `Authorization: Bearer <device_token>` + Body `{"installation_id": "..."}`
- **Retorno Ativo (200 OK):**
```json
{
  "status": "active",
  "expires_at": "ISO-TIMESTAMP",
  "config": {
    "client_name": "João Silva",
    "lists": [
      {
        "name": "Lista Premium 4K",
        "url": "http://servidor.xyz:8080",
        "username": "user123",
        "password": "pass123"
      }
    ]
  }
}
```
- **Retorno Inativo/Expirado:**
```json
{
  "status": "expired",
  "expires_at": "...",
  "config": null
}
```

---

## Segurança e Implementação
- **Arquivos:** `src/routes/api/public/device/*.ts`
- **Tabelas:** `dispositivos`, `codigos_ativacao`, `dispositivo_lista`, `listas_iptv`.
- **Lógica:** O `device_token` é gerado apenas no momento da ativação e nunca é exibido no painel. O polling requer o `poll_token` específico da solicitação.
