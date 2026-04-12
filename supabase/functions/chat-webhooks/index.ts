import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Extract token from URL path: /chat-webhooks/:token
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const token = parts[parts.length - 1];

  if (!token || token === "chat-webhooks") {
    return json({ error: "Webhook token required. Use POST /chat-webhooks/<token>" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Look up webhook by token
    const { data: webhook, error: whError } = await supabase
      .from("chat_webhooks")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (whError || !webhook) {
      return json({ error: "Invalid or inactive webhook" }, 404);
    }

    const body = await req.json();
    const { text, username, icon_url, attachments } = body;

    if (!text) return json({ error: "text field required" }, 400);

    // Build message content (Slack-compatible format)
    let content = text;
    if (attachments?.length) {
      for (const att of attachments) {
        if (att.text) content += `\n${att.text}`;
        if (att.title) content += `\n**${att.title}**`;
      }
    }

    // Insert message
    const { data: msg, error: msgError } = await supabase
      .from("chat_messages")
      .insert({
        channel_id: webhook.channel_id,
        workspace_id: webhook.workspace_id,
        user_id: webhook.created_by,
        content,
        type: "text",
        source: "system",
        metadata: {
          webhook_id: webhook.id,
          webhook_name: username || webhook.name,
          webhook_avatar: icon_url || webhook.avatar_url,
          via: "incoming_webhook",
        },
      })
      .select()
      .single();

    if (msgError) {
      console.error("Webhook message insert error:", msgError);
      return json({ error: "Failed to post message" }, 500);
    }

    // Update last_triggered_at
    await supabase
      .from("chat_webhooks")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", webhook.id);

    return json({ ok: true, message_id: msg.id, channel_id: webhook.channel_id });
  } catch (e) {
    console.error("chat-webhooks error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
