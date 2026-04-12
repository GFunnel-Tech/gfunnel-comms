import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

// ─── Meta Webhook Verification (GET) ───
function handleVerification(url: URL): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return new Response(challenge, { status: 200 });
  }

  console.error("WhatsApp webhook verification failed");
  return json({ error: "Verification failed" }, 403);
}

// ─── Signature Verification ───
async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!APP_SECRET || !signature) return false;

  const expectedSig = signature.replace("sha256=", "");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return expectedSig === computedSig;
}

// ─── Process Incoming Message ───
async function processIncomingMessage(
  supabase: ReturnType<typeof createClient>,
  entry: any
) {
  for (const change of entry.changes || []) {
    if (change.field !== "messages") continue;
    const value = change.value;
    if (!value?.messages?.length) continue;

    const metadata = value.metadata;
    const phoneNumberId = metadata?.phone_number_id;
    // Default workspace — can be made configurable per phone_number_id
    const workspaceId = "ws-acme";

    for (const msg of value.messages) {
      const senderPhone = msg.from;
      const senderName =
        value.contacts?.find((c: any) => c.wa_id === senderPhone)?.profile
          ?.name || senderPhone;

      // Extract message content based on type
      let content = "";
      let msgType: "text" | "image" | "file" = "text";

      switch (msg.type) {
        case "text":
          content = msg.text?.body || "";
          break;
        case "image":
          content = `📷 Image: ${msg.image?.caption || "(no caption)"}`;
          msgType = "image";
          break;
        case "video":
          content = `🎥 Video: ${msg.video?.caption || "(no caption)"}`;
          msgType = "file";
          break;
        case "audio":
          content = "🎵 Voice message";
          msgType = "file";
          break;
        case "document":
          content = `📎 Document: ${msg.document?.filename || "file"}`;
          msgType = "file";
          break;
        case "location":
          content = `📍 Location: ${msg.location?.latitude}, ${msg.location?.longitude}`;
          break;
        case "reaction":
          content = `Reacted with ${msg.reaction?.emoji || ""}`;
          break;
        case "sticker":
          content = "🏷️ Sticker";
          break;
        default:
          content = `[${msg.type} message]`;
      }

      if (!content) continue;

      // Find or create channel for this contact
      const channelId = await getOrCreateContactChannel(
        supabase,
        senderPhone,
        senderName,
        workspaceId,
        phoneNumberId
      );

      // Insert message into chat
      const { error: msgError } = await supabase
        .from("chat_messages")
        .insert({
          channel_id: channelId,
          workspace_id: workspaceId,
          user_id: "00000000-0000-0000-0000-000000000001", // system user
          content,
          type: msgType,
          source: "system",
          metadata: {
            via: "whatsapp",
            whatsapp_message_id: msg.id,
            whatsapp_from: senderPhone,
            whatsapp_name: senderName,
            whatsapp_phone_number_id: phoneNumberId,
            whatsapp_timestamp: msg.timestamp,
            whatsapp_type: msg.type,
          },
        });

      if (msgError) {
        console.error("Failed to insert WhatsApp message:", msgError);
      } else {
        console.log(
          `WhatsApp message from ${senderName} (${senderPhone}) → channel ${channelId}`
        );
      }

      // Update contact last_message_at
      await supabase
        .from("whatsapp_contacts")
        .update({ last_message_at: new Date().toISOString() })
        .eq("phone_number", senderPhone)
        .eq("workspace_id", workspaceId);

      // Mark as read on WhatsApp
      await markAsRead(phoneNumberId, msg.id);
    }
  }
}

// ─── Get or Create Contact Channel ───
async function getOrCreateContactChannel(
  supabase: ReturnType<typeof createClient>,
  phone: string,
  name: string,
  workspaceId: string,
  phoneNumberId: string
): Promise<string> {
  // Check if contact already has a channel
  const { data: existing } = await supabase
    .from("whatsapp_contacts")
    .select("channel_id")
    .eq("phone_number", phone)
    .eq("workspace_id", workspaceId)
    .single();

  if (existing?.channel_id) return existing.channel_id;

  // Create a new channel for this contact
  const { data: channel, error: chError } = await supabase
    .from("chat_channels")
    .insert({
      name: `wa-${name.replace(/\s+/g, "-").toLowerCase()}`,
      description: `WhatsApp conversation with ${name} (${phone})`,
      type: "dm",
      workspace_id: workspaceId,
      emoji: "💬",
      created_by: "00000000-0000-0000-0000-000000000001",
    })
    .select("id")
    .single();

  if (chError || !channel) {
    console.error("Failed to create WhatsApp channel:", chError);
    throw new Error("Failed to create channel for WhatsApp contact");
  }

  // Create contact mapping
  await supabase.from("whatsapp_contacts").insert({
    phone_number: phone,
    whatsapp_name: name,
    whatsapp_id: phoneNumberId,
    channel_id: channel.id,
    workspace_id: workspaceId,
    created_by: "00000000-0000-0000-0000-000000000001",
  });

  return channel.id;
}

// ─── Send WhatsApp Message (Outbound) ───
async function sendWhatsAppMessage(
  phoneNumberId: string,
  recipientPhone: string,
  text: string
) {
  const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!ACCESS_TOKEN) {
    console.error("WHATSAPP_ACCESS_TOKEN not configured");
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send failed:", err);
  }
}

// ─── Mark Message as Read ───
async function markAsRead(phoneNumberId: string, messageId: string) {
  const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!ACCESS_TOKEN) return;

  await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    }
  ).catch((e) => console.error("Failed to mark as read:", e));
}

// ─── Outbound Reply Handler ───
async function handleOutboundReply(
  supabase: ReturnType<typeof createClient>,
  body: any
) {
  const { channel_id, content, workspace_id } = body;
  if (!channel_id || !content) {
    return json({ error: "channel_id and content required" }, 400);
  }

  // Look up the WhatsApp contact for this channel
  const { data: contact } = await supabase
    .from("whatsapp_contacts")
    .select("*")
    .eq("channel_id", channel_id)
    .eq("workspace_id", workspace_id || "ws-acme")
    .single();

  if (!contact) {
    return json({ error: "No WhatsApp contact found for this channel" }, 404);
  }

  await sendWhatsAppMessage(
    contact.whatsapp_id || "",
    contact.phone_number,
    content
  );

  return json({ ok: true, phone: contact.phone_number });
}

// ─── Main Handler ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // GET = Meta webhook verification
  if (req.method === "GET") {
    return handleVerification(url);
  }

  // POST /chat-whatsapp/reply = outbound reply
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];

  if (req.method === "POST" && lastPart === "reply") {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const body = await req.json();
    return handleOutboundReply(supabase, body);
  }

  // POST = incoming webhook from Meta
  if (req.method === "POST") {
    const bodyText = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Verify signature in production
    const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET");
    if (APP_SECRET && !(await verifySignature(bodyText, signature))) {
      console.error("Invalid WhatsApp webhook signature");
      return json({ error: "Invalid signature" }, 401);
    }

    const body = JSON.parse(bodyText);

    // Meta sends a specific structure
    if (body.object !== "whatsapp_business_account") {
      return json({ error: "Unsupported object type" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Process each entry
    for (const entry of body.entry || []) {
      await processIncomingMessage(supabase, entry);
    }

    // Always return 200 to Meta quickly
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
});
