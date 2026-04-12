import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ─── Types ───

interface NormalizedMessage {
  sender_id: string;
  sender_name: string;
  content: string;
  type: "text" | "image" | "file";
  raw_metadata: Record<string, unknown>;
}

interface IntegrationRow {
  id: string;
  workspace_id: string;
  provider: string;
  display_name: string;
  config: Record<string, string>;
  credentials_secret_name: string | null;
  is_active: boolean;
}

interface ProviderAdapter {
  provider: string;
  handleVerification?(url: URL, integration: IntegrationRow | null): Response | null;
  verifyWebhook(req: Request, body: string, integration: IntegrationRow | null): Promise<boolean>;
  parseIncoming(body: any): NormalizedMessage[];
  resolveIntegrationKey(body: any): string | null;
  sendMessage(integration: IntegrationRow, recipientId: string, content: string): Promise<void>;
}

// ─── Helpers ───

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ─── WhatsApp Adapter ───

const whatsappAdapter: ProviderAdapter = {
  provider: "whatsapp",

  handleVerification(url: URL, integration: IntegrationRow | null) {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Try integration-level verify token from config, fall back to env
    const expectedToken = integration?.config?.verify_token || Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === expectedToken) {
      console.log("WhatsApp webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return json({ error: "Verification failed" }, 403);
  },

  async verifyWebhook(_req: Request, body: string, integration: IntegrationRow | null) {
    const appSecret = integration?.config?.app_secret
      ? undefined // secrets should come from vault, not config
      : Deno.env.get("WHATSAPP_APP_SECRET");

    if (!appSecret) return true; // skip if not configured

    const signature = _req.headers.get("x-hub-signature-256");
    if (!signature) return false;

    const expectedSig = signature.replace("sha256=", "");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return expectedSig === computed;
  },

  resolveIntegrationKey(body: any): string | null {
    // Use phone_number_id to resolve which integration this belongs to
    const phoneNumberId = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    return phoneNumberId || null;
  },

  parseIncoming(body: any): NormalizedMessage[] {
    const messages: NormalizedMessage[] = [];
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;
        if (!value?.messages?.length) continue;

        for (const msg of value.messages) {
          const senderPhone = msg.from;
          const senderName = value.contacts?.find((c: any) => c.wa_id === senderPhone)?.profile?.name || senderPhone;
          let content = "";
          let msgType: "text" | "image" | "file" = "text";

          switch (msg.type) {
            case "text": content = msg.text?.body || ""; break;
            case "image": content = `📷 Image: ${msg.image?.caption || "(no caption)"}`; msgType = "image"; break;
            case "video": content = `🎥 Video: ${msg.video?.caption || "(no caption)"}`; msgType = "file"; break;
            case "audio": content = "🎵 Voice message"; msgType = "file"; break;
            case "document": content = `📎 Document: ${msg.document?.filename || "file"}`; msgType = "file"; break;
            case "location": content = `📍 Location: ${msg.location?.latitude}, ${msg.location?.longitude}`; break;
            case "reaction": content = `Reacted with ${msg.reaction?.emoji || ""}`; break;
            case "sticker": content = "🏷️ Sticker"; break;
            default: content = `[${msg.type} message]`;
          }

          if (!content) continue;
          messages.push({
            sender_id: senderPhone,
            sender_name: senderName,
            content,
            type: msgType,
            raw_metadata: {
              whatsapp_message_id: msg.id,
              whatsapp_from: senderPhone,
              whatsapp_name: senderName,
              whatsapp_phone_number_id: value.metadata?.phone_number_id,
              whatsapp_timestamp: msg.timestamp,
              whatsapp_type: msg.type,
            },
          });
        }
      }
    }
    return messages;
  },

  async sendMessage(integration: IntegrationRow, recipientId: string, content: string) {
    const accessToken = Deno.env.get(integration.credentials_secret_name || "WHATSAPP_ACCESS_TOKEN");
    if (!accessToken) { console.error("WhatsApp access token not found"); return; }
    const phoneNumberId = integration.config?.phone_number_id;
    if (!phoneNumberId) { console.error("WhatsApp phone_number_id not configured"); return; }

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: recipientId, type: "text", text: { body: content } }),
    });
    if (!res.ok) console.error("WhatsApp send failed:", await res.text());
  },
};

// ─── Telegram Adapter ───

const telegramAdapter: ProviderAdapter = {
  provider: "telegram",

  handleVerification() { return null; }, // Telegram doesn't use webhook verification

  async verifyWebhook(_req: Request, body: string, integration: IntegrationRow | null) {
    // Telegram webhook verification via secret_token header
    const secretToken = integration?.config?.webhook_secret;
    if (!secretToken) return true;
    const headerToken = _req.headers.get("x-telegram-bot-api-secret-token");
    return headerToken === secretToken;
  },

  resolveIntegrationKey(body: any): string | null {
    // Bot ID is part of the bot token (before the colon) — not in the payload
    // For multi-tenant, we match via the webhook path which includes integration context
    return null;
  },

  parseIncoming(body: any): NormalizedMessage[] {
    const messages: NormalizedMessage[] = [];
    const msg = body.message || body.edited_message;
    if (!msg) return messages;

    const chatId = String(msg.chat.id);
    const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || msg.from?.username || chatId;
    let content = "";
    let msgType: "text" | "image" | "file" = "text";

    if (msg.text) {
      content = msg.text;
    } else if (msg.photo) {
      content = `📷 Photo${msg.caption ? `: ${msg.caption}` : ""}`;
      msgType = "image";
    } else if (msg.document) {
      content = `📎 ${msg.document.file_name || "Document"}${msg.caption ? `: ${msg.caption}` : ""}`;
      msgType = "file";
    } else if (msg.video) {
      content = `🎥 Video${msg.caption ? `: ${msg.caption}` : ""}`;
      msgType = "file";
    } else if (msg.voice) {
      content = "🎵 Voice message";
      msgType = "file";
    } else if (msg.audio) {
      content = `🎵 ${msg.audio.title || "Audio"}`;
      msgType = "file";
    } else if (msg.sticker) {
      content = `${msg.sticker.emoji || "🏷️"} Sticker`;
    } else if (msg.location) {
      content = `📍 Location: ${msg.location.latitude}, ${msg.location.longitude}`;
    } else if (msg.contact) {
      content = `👤 Contact: ${msg.contact.first_name} ${msg.contact.phone_number || ""}`;
    } else {
      content = "[Unsupported message type]";
    }

    if (!content) return messages;

    messages.push({
      sender_id: chatId,
      sender_name: senderName,
      content,
      type: msgType,
      raw_metadata: {
        telegram_update_id: body.update_id,
        telegram_message_id: msg.message_id,
        telegram_chat_id: chatId,
        telegram_chat_type: msg.chat.type,
        telegram_from_id: msg.from?.id,
        telegram_from_username: msg.from?.username,
        telegram_is_edited: !!body.edited_message,
      },
    });
    return messages;
  },

  async sendMessage(integration: IntegrationRow, recipientId: string, content: string) {
    const botToken = Deno.env.get(integration.credentials_secret_name || "TELEGRAM_BOT_TOKEN");
    if (!botToken) { console.error("Telegram bot token not found"); return; }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: recipientId, text: content }),
    });
    if (!res.ok) console.error("Telegram send failed:", await res.text());
  },
};

// ─── Slack Adapter ───

const slackAdapter: ProviderAdapter = {
  provider: "slack",

  handleVerification(_url: URL, _integration: IntegrationRow | null) {
    // Slack uses POST url_verification, not GET — handled in the main POST flow
    return null;
  },

  async verifyWebhook(req: Request, body: string, integration: IntegrationRow | null) {
    const signingSecret = Deno.env.get(
      integration?.credentials_secret_name
        ? `${integration.credentials_secret_name}_SIGNING_SECRET`
        : "SLACK_SIGNING_SECRET"
    );
    if (!signingSecret) return true; // skip if not configured

    const timestamp = req.headers.get("x-slack-request-timestamp");
    const signature = req.headers.get("x-slack-signature");
    if (!timestamp || !signature) return false;

    // Reject requests older than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    const sigBasestring = `v0:${timestamp}:${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(signingSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(sigBasestring));
    const computed = "v0=" + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return signature === computed;
  },

  resolveIntegrationKey(body: any): string | null {
    // Use team_id to resolve which workspace integration
    return body?.team_id || body?.event?.team || null;
  },

  parseIncoming(body: any): NormalizedMessage[] {
    const messages: NormalizedMessage[] = [];
    const event = body.event;
    if (!event) return messages;

    // Only process actual user messages (not bot messages, not subtypes like channel_join)
    if (event.type !== "message" || event.subtype || event.bot_id) return messages;

    const senderId = event.user || "unknown";
    const content = event.text || "";
    if (!content) return messages;

    let msgType: "text" | "image" | "file" = "text";

    // Check for file attachments
    if (event.files?.length) {
      const file = event.files[0];
      if (file.mimetype?.startsWith("image/")) {
        msgType = "image";
      } else {
        msgType = "file";
      }
    }

    messages.push({
      sender_id: senderId,
      sender_name: senderId, // Will be resolved to display name if needed
      content,
      type: msgType,
      raw_metadata: {
        slack_team_id: body.team_id,
        slack_channel_id: event.channel,
        slack_user_id: event.user,
        slack_ts: event.ts,
        slack_thread_ts: event.thread_ts || null,
        slack_channel_type: event.channel_type,
        slack_event_id: body.event_id,
        slack_files: event.files?.map((f: any) => ({ name: f.name, mimetype: f.mimetype, url: f.url_private })) || null,
      },
    });
    return messages;
  },

  async sendMessage(integration: IntegrationRow, recipientId: string, content: string) {
    const botToken = Deno.env.get(
      integration.credentials_secret_name || "SLACK_BOT_TOKEN"
    );
    if (!botToken) { console.error("Slack bot token not found"); return; }

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${botToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel: recipientId, text: content }),
    });
    const data = await res.json();
    if (!data.ok) console.error("Slack send failed:", data.error);
  },
};

// ─── Adapter Registry ───

const adapters: Record<string, ProviderAdapter> = {
  whatsapp: whatsappAdapter,
  telegram: telegramAdapter,
  slack: slackAdapter,
};

// ─── Router: Find or Create Contact + Channel ───

async function getOrCreateContact(
  supabase: ReturnType<typeof createClient>,
  integration: IntegrationRow,
  senderId: string,
  senderName: string
): Promise<string> {
  // Check existing contact
  const { data: existing } = await supabase
    .from("channel_contacts")
    .select("channel_id")
    .eq("integration_id", integration.id)
    .eq("external_id", senderId)
    .single();

  if (existing?.channel_id) return existing.channel_id;

  // Create channel
  const providerLabel = integration.display_name || integration.provider;
  const { data: channel, error: chErr } = await supabase
    .from("chat_channels")
    .insert({
      name: `${integration.provider}-${senderName.replace(/\s+/g, "-").toLowerCase()}`,
      description: `${providerLabel} conversation with ${senderName} (${senderId})`,
      type: "dm",
      workspace_id: integration.workspace_id,
      emoji: "💬",
      created_by: "00000000-0000-0000-0000-000000000001",
    })
    .select("id")
    .single();

  if (chErr || !channel) {
    console.error("Failed to create channel:", chErr);
    throw new Error("Failed to create channel");
  }

  // Create contact mapping
  const { error: contactErr } = await supabase.from("channel_contacts").insert({
    integration_id: integration.id,
    external_id: senderId,
    external_name: senderName,
    channel_id: channel.id,
    workspace_id: integration.workspace_id,
    created_by: "00000000-0000-0000-0000-000000000001",
  });

  if (contactErr) console.error("Failed to create contact:", contactErr);
  return channel.id;
}

// ─── Router: Process Incoming ───

async function processIncoming(
  supabase: ReturnType<typeof createClient>,
  adapter: ProviderAdapter,
  integration: IntegrationRow,
  body: any
) {
  const messages = adapter.parseIncoming(body);

  for (const msg of messages) {
    const channelId = await getOrCreateContact(supabase, integration, msg.sender_id, msg.sender_name);

    const { error } = await supabase.from("chat_messages").insert({
      channel_id: channelId,
      workspace_id: integration.workspace_id,
      user_id: "00000000-0000-0000-0000-000000000001",
      content: msg.content,
      type: msg.type,
      source: "system",
      metadata: { via: adapter.provider, ...msg.raw_metadata },
    });

    if (error) {
      console.error(`Failed to insert ${adapter.provider} message:`, error);
    } else {
      console.log(`${adapter.provider} message from ${msg.sender_name} → channel ${channelId}`);
    }

    // Update last_message_at
    await supabase
      .from("channel_contacts")
      .update({ last_message_at: new Date().toISOString() })
      .eq("integration_id", integration.id)
      .eq("external_id", msg.sender_id);
  }
}

// ─── Router: Outbound Reply ───

async function handleReply(supabase: ReturnType<typeof createClient>, body: any) {
  const { channel_id, content } = body;
  if (!channel_id || !content) return json({ error: "channel_id and content required" }, 400);

  // Find contact + integration for this channel
  const { data: contact } = await supabase
    .from("channel_contacts")
    .select("*, integration:channel_integrations(*)")
    .eq("channel_id", channel_id)
    .single();

  if (!contact?.integration) return json({ error: "No integration found for this channel" }, 404);

  const adapter = adapters[contact.integration.provider];
  if (!adapter) return json({ error: `No adapter for ${contact.integration.provider}` }, 400);

  await adapter.sendMessage(contact.integration, contact.external_id, content);
  return json({ ok: true, provider: contact.integration.provider, recipient: contact.external_id });
}

// ─── Resolve Integration from Request ───

async function resolveIntegration(
  supabase: ReturnType<typeof createClient>,
  provider: string,
  adapter: ProviderAdapter,
  body: any,
  integrationId?: string
): Promise<IntegrationRow | null> {
  // If integration ID is in the URL path, use that directly
  if (integrationId) {
    const { data } = await supabase
      .from("channel_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("is_active", true)
      .single();
    return data as IntegrationRow | null;
  }

  // Try to resolve from payload (e.g. WhatsApp phone_number_id)
  const key = adapter.resolveIntegrationKey(body);
  if (key) {
    // Search config for matching key
    const { data: integrations } = await supabase
      .from("channel_integrations")
      .select("*")
      .eq("provider", provider)
      .eq("is_active", true);

    if (integrations) {
      for (const row of integrations) {
        const config = row.config as Record<string, string>;
        if (Object.values(config).includes(key)) {
          return row as IntegrationRow;
        }
      }
    }
  }

  // Fallback: first active integration for this provider
  const { data: fallback } = await supabase
    .from("channel_integrations")
    .select("*")
    .eq("provider", provider)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return fallback as IntegrationRow | null;
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Expected paths:
  //   /chat-channel-adapter/{provider}
  //   /chat-channel-adapter/{provider}/{integrationId}
  //   /chat-channel-adapter/reply
  const segment1 = pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
  const segment2 = pathParts[pathParts.length - 1];

  // Reply endpoint
  if (req.method === "POST" && segment2 === "reply") {
    const supabase = getSupabase();
    const body = await req.json();
    return handleReply(supabase, body);
  }

  // Determine provider
  const providerName = adapters[segment1] ? segment1 : segment2;
  const integrationId = adapters[segment1] ? segment2 : undefined;
  // Don't treat provider name as integration ID
  const resolvedIntegrationId = integrationId && !adapters[integrationId] ? integrationId : undefined;
  const adapter = adapters[providerName];

  if (!adapter) return json({ error: `Unknown provider: ${providerName}`, supported: Object.keys(adapters) }, 400);

  const supabase = getSupabase();

  // GET = Webhook verification (WhatsApp/Meta)
  if (req.method === "GET") {
    // Try to resolve integration for verification
    const integration = resolvedIntegrationId
      ? (await supabase.from("channel_integrations").select("*").eq("id", resolvedIntegrationId).single()).data as IntegrationRow | null
      : null;
    const verifyResponse = adapter.handleVerification?.(url, integration);
    if (verifyResponse) return verifyResponse;
    return json({ error: "Verification not supported for this provider" }, 400);
  }

  // POST = Incoming webhook
  if (req.method === "POST") {
    const bodyText = await req.text();
    let body: any;
    try { body = JSON.parse(bodyText); } catch { return json({ error: "Invalid JSON" }, 400); }

    const integration = await resolveIntegration(supabase, providerName, adapter, body, resolvedIntegrationId);

    // Verify webhook signature
    if (!(await adapter.verifyWebhook(req, bodyText, integration))) {
      console.error(`${providerName} webhook signature verification failed`);
      return json({ error: "Invalid signature" }, 401);
    }

    if (!integration) {
      console.error(`No active ${providerName} integration found`);
      return json({ error: `No active ${providerName} integration configured` }, 404);
    }

    await processIncoming(supabase, adapter, integration, body);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
});
