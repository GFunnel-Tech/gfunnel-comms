# Channel Adapter — Unified Multi-Platform Messaging

Route messages from any supported messaging platform into GFunnel Chat via a single edge function.

## Supported Providers

| Provider | Inbound | Outbound | Verification |
|----------|---------|----------|-------------|
| WhatsApp | ✅ | ✅ | Meta hub.verify + HMAC-SHA256 |
| Telegram | ✅ | ✅ | Secret token header |
| Facebook | 🔜 | 🔜 | — |
| Instagram | 🔜 | 🔜 | — |
| LinkedIn | 🔜 | 🔜 | — |
| SMS | 🔜 | 🔜 | — |
| Custom Webhook | 🔜 | 🔜 | — |

## Endpoints

### Inbound Webhook

```
POST /chat-channel-adapter/{provider}
POST /chat-channel-adapter/{provider}/{integration_id}
```

The function resolves which workspace integration to use by:
1. `integration_id` in the URL path (explicit)
2. Matching payload data to integration config (e.g. WhatsApp `phone_number_id`)
3. Fallback to first active integration for that provider

### Webhook Verification (Meta platforms)

```
GET /chat-channel-adapter/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
```

### Outbound Reply

```
POST /chat-channel-adapter/reply
```

**Body:**
```json
{
  "channel_id": "uuid-of-chat-channel",
  "content": "Thanks for reaching out!"
}
```

The function looks up the `channel_contacts` mapping to find the integration and external recipient, then sends via the correct provider API.

## Setup

### 1. Create an Integration (via Admin UI or API)

Navigate to `/integrations` and add a new integration for your provider. Fill in the provider-specific config fields.

### 2. Configure Secrets

Add the provider's API credentials as secrets in Lovable Cloud. Reference the secret name in the integration's `credentials_secret_name` field.

**WhatsApp:**
- `WHATSAPP_ACCESS_TOKEN` — Meta Business permanent token
- `WHATSAPP_APP_SECRET` — For signature verification
- `WHATSAPP_VERIFY_TOKEN` — For webhook verification

**Telegram:**
- `TELEGRAM_BOT_TOKEN` — From @BotFather

### 3. Configure Webhook URL

Point your provider's webhook settings to:

```
https://<project-ref>.supabase.co/functions/v1/chat-channel-adapter/{provider}
```

Or for a specific integration:

```
https://<project-ref>.supabase.co/functions/v1/chat-channel-adapter/{provider}/{integration_id}
```

## How It Works

1. Incoming webhook hits the adapter
2. Router resolves which `channel_integration` this belongs to
3. Provider adapter verifies the signature and normalizes the message
4. Router finds or creates a `channel_contact` + `chat_channel` for the sender
5. Message is inserted into `chat_messages` with `source: "system"` and provider metadata
6. Message appears in GFunnel Chat in real-time

## Database Tables

- **`channel_integrations`** — Per-workspace provider config (no secrets in DB)
- **`channel_contacts`** — Maps external IDs to GFunnel Chat channels
- **`messaging_provider`** enum — whatsapp, telegram, facebook, instagram, linkedin, sms, custom_webhook

## Adding a New Provider

Implement the `ProviderAdapter` interface (~50 lines):

```typescript
interface ProviderAdapter {
  provider: string;
  handleVerification?(url, integration): Response | null;
  verifyWebhook(req, body, integration): Promise<boolean>;
  parseIncoming(body): NormalizedMessage[];
  resolveIntegrationKey(body): string | null;
  sendMessage(integration, recipientId, content): Promise<void>;
}
```

Register it in the `adapters` map and add the enum value via migration.
