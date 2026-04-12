import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

// Authenticate via API key (gfc_xxx) or JWT Bearer token
async function authenticate(req: Request): Promise<{ userId: string; workspaceId?: string; authType: "api_key" | "jwt" } | Response> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check X-API-Key header first
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    // Hash the key and look it up
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const { data: keyRow, error } = await supabaseAdmin
      .from("chat_api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    if (error || !keyRow) return err("Invalid API key", 401);

    // Check expiry
    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
      return err("API key expired", 401);
    }

    // Update last_used_at
    await supabaseAdmin.from("chat_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

    return { userId: keyRow.created_by, workspaceId: keyRow.workspace_id, authType: "api_key" };
  }

  // Fall back to JWT Bearer
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return err("Missing authentication", 401);

  const token = authHeader.replace("Bearer ", "");
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(token);
  if (claimsError || !claims?.claims) return err("Invalid token", 401);

  return { userId: claims.claims.sub as string, authType: "jwt" };
}

// Route parser
function parseRoute(url: URL): { resource: string; id?: string; subResource?: string } {
  const parts = url.pathname.replace(/^\/chat-api\/?/, "").split("/").filter(Boolean);
  return { resource: parts[0] || "", id: parts[1], subResource: parts[2] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const { resource, id, subResource } = parseRoute(url);
  const method = req.method;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // ─── CHANNELS ───
    if (resource === "channels") {
      if (method === "GET" && !id) {
        const workspaceId = url.searchParams.get("workspace_id") || auth.workspaceId;
        if (!workspaceId) return err("workspace_id required");
        const { data, error } = await supabase.from("chat_channels").select("*").eq("workspace_id", workspaceId).order("sort_order");
        if (error) return err(error.message, 500);
        return json({ channels: data });
      }

      if (method === "GET" && id && !subResource) {
        const { data, error } = await supabase.from("chat_channels").select("*").eq("id", id).single();
        if (error) return err("Channel not found", 404);
        return json(data);
      }

      if (method === "POST" && !id) {
        const body = await req.json();
        const { name, description, type, workspace_id, emoji } = body;
        if (!name || !workspace_id) return err("name and workspace_id required");
        const { data, error } = await supabase.from("chat_channels").insert({
          name, description, type: type || "public", workspace_id, emoji: emoji || "#",
          created_by: auth.userId,
        }).select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      if (method === "PATCH" && id) {
        const body = await req.json();
        const allowed = ["name", "description", "topic", "is_archived", "is_read_only", "emoji"];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) if (body[key] !== undefined) updates[key] = body[key];
        const { data, error } = await supabase.from("chat_channels").update(updates).eq("id", id).select().single();
        if (error) return err(error.message, 500);
        return json(data);
      }

      // GET /channels/:id/messages
      if (method === "GET" && id && subResource === "messages") {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const before = url.searchParams.get("before");
        let query = supabase.from("chat_messages").select("*").eq("channel_id", id).is("thread_parent_id", null).order("created_at", { ascending: false }).limit(Math.min(limit, 100));
        if (before) query = query.lt("created_at", before);
        const { data, error } = await query;
        if (error) return err(error.message, 500);
        return json({ messages: data?.reverse() || [] });
      }
    }

    // ─── MESSAGES ───
    if (resource === "messages") {
      if (method === "POST" && !id) {
        const body = await req.json();
        const { channel_id, content, workspace_id, type: msgType } = body;
        if (!channel_id || !content || !workspace_id) return err("channel_id, content, and workspace_id required");
        const { data, error } = await supabase.from("chat_messages").insert({
          channel_id, content, workspace_id, user_id: auth.userId,
          type: msgType || "text", source: auth.authType === "api_key" ? "system" : "user",
        }).select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      if (method === "PATCH" && id) {
        const body = await req.json();
        const { content } = body;
        if (!content) return err("content required");
        const { data, error } = await supabase.from("chat_messages").update({
          content, is_edited: true, edited_at: new Date().toISOString(),
        }).eq("id", id).eq("user_id", auth.userId).select().single();
        if (error) return err(error.message, 500);
        return json(data);
      }

      if (method === "DELETE" && id) {
        const { error } = await supabase.from("chat_messages").update({
          is_deleted: true, deleted_at: new Date().toISOString(), content: "[deleted]",
        }).eq("id", id).eq("user_id", auth.userId);
        if (error) return err(error.message, 500);
        return json({ ok: true });
      }

      // POST /messages/:id/reactions
      if (method === "POST" && id && subResource === "reactions") {
        const body = await req.json();
        const { emoji } = body;
        if (!emoji) return err("emoji required");
        const { data: msg } = await supabase.from("chat_messages").select("reactions").eq("id", id).single();
        if (!msg) return err("Message not found", 404);
        const reactions = (msg.reactions || {}) as Record<string, string[]>;
        if (!reactions[emoji]) reactions[emoji] = [];
        const idx = reactions[emoji].indexOf(auth.userId);
        if (idx >= 0) reactions[emoji].splice(idx, 1);
        else reactions[emoji].push(auth.userId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
        await supabase.from("chat_messages").update({ reactions }).eq("id", id);
        return json({ reactions });
      }

      // POST /messages/:id/thread
      if (method === "POST" && id && subResource === "thread") {
        const body = await req.json();
        const { content, workspace_id } = body;
        if (!content || !workspace_id) return err("content and workspace_id required");
        // Get parent message to know channel_id
        const { data: parent } = await supabase.from("chat_messages").select("channel_id, thread_reply_count, thread_participant_ids").eq("id", id).single();
        if (!parent) return err("Parent message not found", 404);
        const { data: reply, error } = await supabase.from("chat_messages").insert({
          channel_id: parent.channel_id, content, workspace_id, user_id: auth.userId,
          type: "text", source: auth.authType === "api_key" ? "system" : "user",
          thread_parent_id: id,
        }).select().single();
        if (error) return err(error.message, 500);
        // Update parent thread metadata
        const participants = new Set(parent.thread_participant_ids || []);
        participants.add(auth.userId);
        await supabase.from("chat_messages").update({
          thread_reply_count: (parent.thread_reply_count || 0) + 1,
          thread_last_reply_at: new Date().toISOString(),
          thread_participant_ids: Array.from(participants),
        }).eq("id", id);
        return json(reply, 201);
      }
    }

    // ─── API KEYS (management) ───
    if (resource === "api-keys") {
      if (method === "GET" && !id) {
        const { data, error } = await supabase.from("chat_api_keys").select("id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at").eq("created_by", auth.userId);
        if (error) return err(error.message, 500);
        return json({ api_keys: data });
      }

      if (method === "POST" && !id) {
        const body = await req.json();
        const { name, workspace_id, scopes, expires_at } = body;
        if (!name || !workspace_id) return err("name and workspace_id required");
        // Generate key
        const rawKey = `gfc_${crypto.randomUUID().replace(/-/g, "")}`;
        const prefix = rawKey.slice(0, 8) + "...";
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
        const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
        const { data, error } = await supabase.from("chat_api_keys").insert({
          workspace_id, name, key_hash: keyHash, key_prefix: prefix,
          scopes: scopes || ["messaging", "channels"], expires_at,
          created_by: auth.userId,
        }).select().single();
        if (error) return err(error.message, 500);
        // Return the raw key ONCE - it won't be retrievable again
        return json({ ...data, key: rawKey }, 201);
      }

      if (method === "DELETE" && id) {
        const { error } = await supabase.from("chat_api_keys").delete().eq("id", id).eq("created_by", auth.userId);
        if (error) return err(error.message, 500);
        return json({ ok: true });
      }
    }

    // ─── WEBHOOKS (management) ───
    if (resource === "webhooks") {
      if (method === "GET" && !id) {
        const { data, error } = await supabase.from("chat_webhooks").select("*").eq("created_by", auth.userId);
        if (error) return err(error.message, 500);
        return json({ webhooks: data });
      }

      if (method === "POST" && !id) {
        const body = await req.json();
        const { name, channel_id, workspace_id, avatar_url } = body;
        if (!name || !channel_id || !workspace_id) return err("name, channel_id, and workspace_id required");
        const { data, error } = await supabase.from("chat_webhooks").insert({
          name, channel_id, workspace_id, avatar_url, created_by: auth.userId,
        }).select().single();
        if (error) return err(error.message, 500);
        const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/chat-webhooks/${data.token}`;
        return json({ ...data, webhook_url: webhookUrl }, 201);
      }

      if (method === "DELETE" && id) {
        const { error } = await supabase.from("chat_webhooks").delete().eq("id", id).eq("created_by", auth.userId);
        if (error) return err(error.message, 500);
        return json({ ok: true });
      }
    }

    // ─── EVENT SUBSCRIPTIONS ───
    if (resource === "events") {
      if (method === "GET" && !id) {
        const { data, error } = await supabase.from("chat_event_subscriptions").select("id, workspace_id, callback_url, events, is_active, failure_count, last_delivered_at, created_at").eq("created_by", auth.userId);
        if (error) return err(error.message, 500);
        return json({ subscriptions: data });
      }

      if (method === "POST" && !id) {
        const body = await req.json();
        const { workspace_id, api_key_id, callback_url, events: eventTypes } = body;
        if (!workspace_id || !api_key_id || !callback_url) return err("workspace_id, api_key_id, and callback_url required");
        const { data, error } = await supabase.from("chat_event_subscriptions").insert({
          workspace_id, api_key_id, callback_url,
          events: eventTypes || ["message.created"],
          created_by: auth.userId,
        }).select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      if (method === "DELETE" && id) {
        const { error } = await supabase.from("chat_event_subscriptions").delete().eq("id", id).eq("created_by", auth.userId);
        if (error) return err(error.message, 500);
        return json({ ok: true });
      }
    }

    return err(`Unknown route: ${method} /${resource}${id ? "/" + id : ""}`, 404);
  } catch (e) {
    console.error("chat-api error:", e);
    return err("Internal server error", 500);
  }
});
