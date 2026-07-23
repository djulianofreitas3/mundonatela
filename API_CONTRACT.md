# Contrato da API Pública - Mundo na Tela

**URL Base de Produção:** `https://mundonatela.lovable.app`

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
Gera o código de 6 dígitos para exibição na tela do aparelho. Se houver uma solicitação pendente, retorna os mesmos dados.

- **Endpoint:** `POST /api/public/device/request-code`
- **Body:**
```json
{
  "installation_id": "UUID-GERADO-PELO-APP",
  "force_new": false
}
```
- **Parâmetros:**
  - `force_new` (boolean, opcional): Se `true`, invalida qualquer código pendente anterior e gera um novo.

- **Retorno (200 OK):**
```json
{
  "success": true,
  "code": "ABC123",
  "request_id": "UUID-DA-SOLICITACAO",
  "poll_token": "TOKEN-SECRETO-DE-CONSULTA",
  "expires_at": null
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
  - `{"status": "blocked"}`: Dispositivo bloqueado pelo administrador.

---

## 4. Obter Configuração (Check)
Utilizado em cada abertura do aplicativo para obter os dados da lista Xtream.

- **Endpoint:** `POST /api/public/device/check`
- **Headers:** `Authorization: Bearer <device_token>`
- **Body:** `{"installation_id": "..."}`
- **Retorno Ativo (200 OK):**
```json
{
  "status": "active",
  "expires_at": null,
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
- **Retorno Inativo/Bloqueado:**
```json
{
  "status": "blocked",
  "expires_at": null,
  "config": null
}
```

---

## Regras de Ativação
- O código não expira automaticamente (expires_at: null).
- A ativação é permanente por padrão (vencimento: null).
- O acesso é interrompido apenas por ação manual no painel (Bloquear/Remover).
