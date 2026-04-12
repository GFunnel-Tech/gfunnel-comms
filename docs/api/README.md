# GFunnel Chat API

A platform-style REST API for integrating with GFunnel Chat — similar to Slack, Teams, and Discord APIs.

## Base URL

```
https://<project-ref>.supabase.co/functions/v1
```

## Authentication

The API supports two authentication methods:

### 1. API Keys (for bots & integrations)

Generate an API key via `POST /chat-api/api-keys`. Keys start with `gfc_` and are shown only once at creation.

```bash
curl -H "X-API-Key: gfc_abc123..." https://...//functions/v1/chat-api/channels?workspace_id=ws1
```

### 2. JWT Bearer Token (for web UI)

Use a Supabase auth session token:

```bash
curl -H "Authorization: Bearer <jwt>" https://.../functions/v1/chat-api/channels?workspace_id=ws1
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **Channels** | | |
| GET | `/chat-api/channels?workspace_id=X` | List channels |
| GET | `/chat-api/channels/:id` | Get channel |
| POST | `/chat-api/channels` | Create channel |
| PATCH | `/chat-api/channels/:id` | Update channel |
| GET | `/chat-api/channels/:id/messages` | List messages |
| **Messages** | | |
| POST | `/chat-api/messages` | Send message |
| PATCH | `/chat-api/messages/:id` | Edit message |
| DELETE | `/chat-api/messages/:id` | Delete message |
| POST | `/chat-api/messages/:id/reactions` | Toggle reaction |
| POST | `/chat-api/messages/:id/thread` | Reply in thread |
| **API Keys** | | |
| GET | `/chat-api/api-keys` | List your keys |
| POST | `/chat-api/api-keys` | Create key |
| DELETE | `/chat-api/api-keys/:id` | Revoke key |
| **Webhooks** | | |
| GET | `/chat-api/webhooks` | List webhooks |
| POST | `/chat-api/webhooks` | Create webhook |
| DELETE | `/chat-api/webhooks/:id` | Delete webhook |
| POST | `/chat-webhooks/:token` | Post via webhook |
| **Events** | | |
| GET | `/chat-events` | List event types |
| GET | `/chat-api/events` | List subscriptions |
| POST | `/chat-api/events` | Create subscription |
| DELETE | `/chat-api/events/:id` | Delete subscription |

## Detailed Reference

- [Channels](./channels.md)
- [Messages](./messages.md)
- [Webhooks](./webhooks.md)
- [Events](./events.md)
- [Authentication](./authentication.md)
