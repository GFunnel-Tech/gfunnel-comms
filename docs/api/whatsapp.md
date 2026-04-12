# WhatsApp Integration

Receive and send WhatsApp messages through GFunnel Chat using the Meta WhatsApp Business API.

## Setup

### 1. Meta Business Account

1. Go to [Meta for Developers](https://developers.facebook.com/) → Create App → Business type
2. Add **WhatsApp** product to your app
3. Get your **Phone Number ID** and **Access Token** from the WhatsApp dashboard

### 2. Configure Secrets

Add these secrets in Lovable Cloud:

| Secret | Description |
|--------|-------------|
| `WHATSAPP_VERIFY_TOKEN` | A string you choose (e.g. `gfunnel-wa-verify-2024`) |
| `WHATSAPP_ACCESS_TOKEN` | Permanent token from Meta Business dashboard |
| `WHATSAPP_APP_SECRET` | From Meta App → Settings → Basic → App Secret |

### 3. Configure Webhook in Meta

In your Meta App → WhatsApp → Configuration:

- **Callback URL**: `https://<project-ref>.supabase.co/functions/v1/chat-whatsapp`
- **Verify Token**: Same value as `WHATSAPP_VERIFY_TOKEN`
- **Subscribe to**: `messages`

## How It Works

### Inbound (WhatsApp → GFunnel Chat)

When someone messages your WhatsApp number:

1. Meta sends a webhook to `/chat-whatsapp`
2. The edge function verifies the signature
3. It finds or creates a GFunnel Chat channel for that contact
4. The message is inserted as a `chat_message` with `source: "system"` and WhatsApp metadata
5. The message appears in the corresponding channel in real-time

Supported message types: text, image, video, audio, document, location, reaction, sticker.

### Outbound (GFunnel Chat → WhatsApp)

```
POST /chat-whatsapp/reply
```

**Body:**
```json
{
  "channel_id": "uuid-of-whatsapp-channel",
  "content": "Thanks for reaching out!",
  "workspace_id": "ws-acme"
}
```

The function looks up the WhatsApp contact mapped to that channel and sends the reply via Meta Cloud API.

## Message Metadata

Every incoming WhatsApp message includes metadata for traceability:

```json
{
  "via": "whatsapp",
  "whatsapp_message_id": "wamid.xxx",
  "whatsapp_from": "+1234567890",
  "whatsapp_name": "John Doe",
  "whatsapp_phone_number_id": "123456",
  "whatsapp_type": "text"
}
```

## Database

The `whatsapp_contacts` table maps phone numbers to GFunnel Chat channels:

| Column | Description |
|--------|-------------|
| phone_number | WhatsApp phone number |
| whatsapp_name | Contact's WhatsApp display name |
| channel_id | Linked GFunnel Chat channel |
| workspace_id | Workspace scope |
| last_message_at | Last message timestamp |
