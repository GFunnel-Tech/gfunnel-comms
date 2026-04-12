---
name: Platform API
description: REST API with API keys, webhooks, events — Slack/Discord-style integrations
type: feature
---
Three edge functions:
- chat-api: RESTful router (channels, messages, api-keys, webhooks, events management). Dual auth: X-API-Key (gfc_ prefix, SHA-256 hashed) or JWT Bearer.
- chat-webhooks: Incoming webhooks POST /chat-webhooks/:token (no auth, Slack-compatible format).
- chat-events: Outgoing event delivery with HMAC-SHA256 signatures. Auto-disables after 10 failures.

DB tables: chat_api_keys, chat_webhooks, chat_event_subscriptions (all RLS creator-only).

Docs: /api-docs route (in-app interactive) + docs/api/*.md (static markdown).
