# Webhooks API

Incoming webhooks allow external tools (CI/CD, monitoring, CRMs) to post messages to GFunnel Chat channels using a simple HTTP POST — just like Slack incoming webhooks.

## Create a Webhook

```
POST /chat-api/webhooks
```

**Body:**
```json
{
  "name": "GitHub Notifications",
  "channel_id": "uuid-of-channel",
  "workspace_id": "ws-acme",
  "avatar_url": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "GitHub Notifications",
  "token": "a1b2c3d4e5f6...",
  "webhook_url": "https://<project>.supabase.co/functions/v1/chat-webhooks/a1b2c3d4e5f6...",
  "channel_id": "uuid",
  "is_active": true
}
```

Save the `webhook_url` — the token won't be shown again.

## Post via Webhook

```
POST /chat-webhooks/:token
```

The format is Slack-compatible:

**Body:**
```json
{
  "text": "Build #142 passed ✅",
  "username": "CI Bot",
  "icon_url": "https://example.com/bot-avatar.png",
  "attachments": [
    {
      "title": "Deploy Summary",
      "text": "Deployed commit abc123 to production"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | ✅ | Message content |
| username | string | | Display name override |
| icon_url | string | | Avatar URL override |
| attachments | array | | Slack-style attachments |

**Response:**
```json
{
  "ok": true,
  "message_id": "uuid",
  "channel_id": "uuid"
}
```

No authentication required — the unique token in the URL serves as the credential.

## List Webhooks

```
GET /chat-api/webhooks
```

## Delete Webhook

```
DELETE /chat-api/webhooks/:id
```
