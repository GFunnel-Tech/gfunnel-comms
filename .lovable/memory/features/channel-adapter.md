---
name: Unified Channel Adapter
description: Multi-tenant messaging adapter — channel_integrations + channel_contacts tables, messaging_provider enum
type: feature
---
Tables:
- `channel_integrations`: per-workspace provider config (workspace_id, provider enum, display_name, config jsonb, credentials_secret_name, is_active). RLS: creator-only.
- `channel_contacts`: maps external platform contacts to chat_channels (integration_id FK, external_id, external_name, channel_id FK, metadata jsonb). Unique on (integration_id, external_id). RLS: creator-only.
- `messaging_provider` enum: whatsapp, telegram, facebook, instagram, linkedin, sms, custom_webhook.

Edge function pattern: single `chat-channel-adapter` with ProviderAdapter interface (verifyWebhook, parseIncoming, sendMessage, handleVerification?). Router handles all DB ops.

Migration path: existing `whatsapp_contacts` table stays until adapter is live, then deprecated.
