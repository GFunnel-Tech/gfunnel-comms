# Authentication

GFunnel Chat API supports two authentication methods.

## API Keys (Recommended for integrations)

API keys are scoped to a workspace and start with `gfc_`. Pass them via the `X-API-Key` header:

```bash
curl -X GET \
  -H "X-API-Key: gfc_abc123def456..." \
  "https://<project>.supabase.co/functions/v1/chat-api/channels?workspace_id=ws-acme"
```

### Creating an API Key

```bash
curl -X POST \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Bot",
    "workspace_id": "ws-acme",
    "scopes": ["messaging", "channels", "webhooks", "events"]
  }' \
  "https://<project>.supabase.co/functions/v1/chat-api/api-keys"
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Bot",
  "key": "gfc_abc123def456...",
  "key_prefix": "gfc_abc1...",
  "scopes": ["messaging", "channels", "webhooks", "events"],
  "is_active": true
}
```

> ⚠️ The full `key` is shown **only once** at creation. Store it securely.

### Available Scopes

| Scope | Grants access to |
|-------|-----------------|
| `messaging` | Send, edit, delete messages; reactions; threads |
| `channels` | List, create, update channels |
| `webhooks` | Manage incoming webhooks |
| `events` | Manage event subscriptions; trigger events |

### Key Management

```bash
# List keys (shows prefix only, not full key)
GET /chat-api/api-keys

# Revoke a key
DELETE /chat-api/api-keys/:id
```

## JWT Bearer Token (for web UI)

Use a Supabase auth session token for browser-based access:

```bash
curl -X GET \
  -H "Authorization: Bearer eyJhbG..." \
  "https://<project>.supabase.co/functions/v1/chat-api/channels?workspace_id=ws-acme"
```

## Rate Limits

- API keys: 100 requests/minute per key
- JWT tokens: 200 requests/minute per user

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request — missing or invalid parameters |
| 401 | Unauthorized — invalid or missing credentials |
| 404 | Not found — resource doesn't exist |
| 405 | Method not allowed |
| 500 | Internal server error |
