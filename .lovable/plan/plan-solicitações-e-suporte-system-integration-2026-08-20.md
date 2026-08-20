# Plan: Solicitações e Suporte System Integration

Implementation of a complete support and content request system, including database schema, administrative UI with real-time updates, and a public API endpoint for Android integration.

## User Review Required

> [!IMPORTANT]
> - The administrative credentials (admin@mundonatela.com / admin123456) are already set up in the database.
> - The new "Solicitações" tab will appear in the sidebar with a real-time badge for new requests.
> - The public API is ready at `/api/public/submit-support-request`.

## Proposed Changes

### Database (Supabase)
- Create `support_requests` table with fields for request type, category, content details, device info, and admin tracking.
- Enable RLS: Admin has full access; Public (app) can only insert.
- Enable Realtime for live UI updates.

### Backend (Server Functions & API)
- **Support Functions:** `getSupportRequests`, `getSupportStats`, and `updateSupportRequest` for admin operations.
- **Public API:** `/api/public/submit-support-request` for the Android app to send new requests securely.

### Administrative UI
- **Menu Integration:** Add "Solicitações" to the sidebar with a notification badge.
- **Support Dashboard:** New page at `/solicitacoes` with status cards (New, In Review, Completed, Total).
- **Requests Table:** Modern table with filters, search, and real-time polling.
- **Detail View:** Modal showing full device information and allowing status changes and internal admin notes.
- **Dashboard Integration:** Add a "Solicitações Novas" card to the main dashboard.

### API Contract (for Android App)
- **Endpoint:** `POST /api/public/submit-support-request`
- **Request Body Example:**
```json
{
  "request_type": "content_request",
  "category": "movie",
  "content_name": "Gladiador 2",
  "device_name": "Mi Box",
  "installation_id": "ABC-123",
  "app_version": "2.5.13"
}
```
- **Response Example:**
```json
{
  "success": true,
  "id": "uuid-of-request"
}
```

## Technical Details

- **Realtime:** Uses Supabase `POSTGRES_CHANGES` to trigger UI updates without refresh.
- **Security:** RLS policies prevent public reading or editing of support data.
- **Validation:** Zod schemas for all inputs (UI and API).
- **Responsive Design:** Adaptive layout for Mobile (cards) and Desktop (table).
