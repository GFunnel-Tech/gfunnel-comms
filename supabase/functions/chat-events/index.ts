import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-api-key",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

// HMAC-SHA256 signature for event payloads
async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Deliver an event to all matching subscriptions
async function deliverEvent(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  eventType: string,
  eventData: Record<string, unknown>
) {
  const { data: subs } = await supabase
    .from("chat_event_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .contains("events", [eventType]);

  if (!subs?.length) return { delivered: 0 };

  const timestamp = new Date().toISOString();
  const eventPayload = {
    type: eventType,
    timestamp,
    data: eventData,
  };
  const payloadStr = JSON.stringify(eventPayload);

  let delivered = 0;
  for (const sub of subs) {
    try {
      const signature = await signPayload(payloadStr, sub.signing_secret);
      const response = await fetch(sub.callback_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GFunnel-Signature": `sha256=${signature}`,
          "X-GFunnel-Event": eventType,
          "X-GFunnel-Timestamp": timestamp,
        },
        body: payloadStr,
      });

      if (response.ok) {
        delivered++;
        await supabase.from("chat_event_subscriptions").update({
          last_delivered_at: timestamp,
          failure_count: 0,
        }).eq("id", sub.id);
      } else {
        await response.text(); // consume body
        const newCount = (sub.failure_count || 0) + 1;
        await supabase.from("chat_event_subscriptions").update({
          failure_count: newCount,
          is_active: newCount < 10, // auto-disable after 10 consecutive failures
        }).eq("id", sub.id);
      }
    } catch (e) {
      console.error(`Event delivery failed for sub ${sub.id}:`, e);
      const newCount = (sub.failure_count || 0) + 1;
      await supabase.from("chat_event_subscriptions").update({
        failure_count: newCount,
        is_active: newCount < 10,
      }).eq("id", sub.id);
    }
  }

  return { delivered, total: subs.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // This endpoint is called internally or by the system to trigger event delivery
    // POST /chat-events { workspace_id, event_type, data }
    if (req.method === "POST") {
      // Verify internal call via service role key or API key
      const authHeader = req.headers.get("authorization");
      const apiKey = req.headers.get("x-api-key");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      let authorized = false;

      // Check service role key (internal calls)
      if (authHeader === `Bearer ${serviceKey}`) {
        authorized = true;
      }

      // Check API key
      if (!authorized && apiKey) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey));
        const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
        const { data: keyRow } = await supabase
          .from("chat_api_keys")
          .select("scopes")
          .eq("key_hash", keyHash)
          .eq("is_active", true)
          .single();
        if (keyRow?.scopes?.includes("events")) authorized = true;
      }

      if (!authorized) return json({ error: "Unauthorized" }, 401);

      const body = await req.json();
      const { workspace_id, event_type, data } = body;
      if (!workspace_id || !event_type) return json({ error: "workspace_id and event_type required" }, 400);

      const result = await deliverEvent(supabase, workspace_id, event_type, data || {});
      return json({ ok: true, ...result });
    }

    // GET /chat-events/types — list available event types
    if (req.method === "GET") {
      return json({
        event_types: [
          { name: "message.created", description: "A new message was posted" },
          { name: "message.updated", description: "A message was edited" },
          { name: "message.deleted", description: "A message was deleted" },
          { name: "reaction.added", description: "A reaction was added to a message" },
          { name: "reaction.removed", description: "A reaction was removed from a message" },
          { name: "channel.created", description: "A new channel was created" },
          { name: "channel.updated", description: "A channel was updated" },
          { name: "channel.archived", description: "A channel was archived" },
          { name: "member.joined", description: "A user joined a channel" },
          { name: "member.left", description: "A user left a channel" },
          { name: "thread.reply", description: "A reply was posted in a thread" },
          { name: "presence.changed", description: "A user's presence status changed" },
        ],
      });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("chat-events error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
