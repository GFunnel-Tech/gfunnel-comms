---
name: Unified Channel Adapter
description: Multi-tenant messaging adapter — channel_integrations + channel_contacts tables, chat-channel-adapter edge function
type: feature
---
Tables:
- `channel_integrations`: per-workspace provider config (workspace_id, provider enum, display_name, config jsonb, credentials_secret_name, is_active). RLS: creator-only.
- `channel_contacts`: maps external platform contacts to chat_channels (integration_id FK, external_id, external_name, channel_id FK, metadata jsonb). Unique on (integration_id, external_id). RLS: creator-only.
- `messaging_provider` enum: whatsapp, telegram, facebook, instagram, linkedin, sms, custom_webhook.

Edge function: `chat-channel-adapter` (single function, replaces old `chat-whatsapp`)
- Routes: POST /{provider}, POST /{provider}/{integration_id}, GET /{provider} (verification), POST /reply
- WhatsApp + Telegram adapters implemented. Each ~50 lines implementing ProviderAdapter interface.
- Router handles: integration resolution, contact/channel creation, message insertion, outbound replies.

Admin UI: /integrations page with provider cards, add/edit/toggle/delete.
Docs: docs/api/channel-adapter.md

Deprecated: chat-whatsapp function + whatsapp_contacts table (kept for now but unused).
