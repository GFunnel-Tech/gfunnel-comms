# Project Memory

## Core
GFunnel Chat module — Slack-like team chat embedded as iframe in GFunnel.
Dark theme: bg #0A0A1E, accent #F97316 (orange), info #06B6D4 (cyan for AI).
Fonts: Sora headings, DM Sans body. All Tailwind, zero inline styles.
Bridge SDK: gfunnel-bridge.ts + useGFunnel.ts for iframe postMessage comms.
Demo mode when standalone (not in iframe). 5 users, 7 channels, AI + automation msgs.

## Memories
- [Bridge SDK](mem://features/bridge-sdk) — GFunnel iframe bridge with postMessage, auth token, presence
- [Design system](mem://design/tokens) — Full dark theme tokens, department colors, font config
- [V2 spec](mem://features/v2-spec) — Full feature list from uploaded prompt doc
- [Platform API](mem://features/platform-api) — REST API with API keys, webhooks, events
- [Channel Adapter](mem://features/channel-adapter) — Multi-tenant messaging adapter: channel_integrations, channel_contacts, messaging_provider enum
