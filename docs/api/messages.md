# Messages API

## Send Message

```
POST /chat-api/messages
```

**Body:**
```json
{
  "channel_id": "uuid",
  "workspace_id": "ws-acme",
  "content": "Hello from the API! 🤖"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| channel_id | string | ✅ | Target channel |
| workspace_id | string | ✅ | Workspace ID |
| content | string | ✅ | Message text (supports markdown) |
| type | string | | `text`, `system` (default: `text`) |

Messages sent via API keys have `source: "system"`, while JWT-authenticated messages have `source: "user"`.

## Edit Message

```
PATCH /chat-api/messages/:id
```

**Body:**
```json
{
  "content": "Updated message text"
}
```

Only the message author can edit. Edited messages show `is_edited: true` and `edited_at` timestamp.

## Delete Message

```
DELETE /chat-api/messages/:id
```

Soft-deletes the message. Content is replaced with `[deleted]`. Only the message author can delete.

## Toggle Reaction

```
POST /chat-api/messages/:id/reactions
```

**Body:**
```json
{
  "emoji": "👍"
}
```

Toggles the reaction: adds if not present, removes if already reacted by the same user.

**Response:**
```json
{
  "reactions": {
    "👍": ["user-id-1", "user-id-2"],
    "🎉": ["user-id-3"]
  }
}
```

## Reply in Thread

```
POST /chat-api/messages/:id/thread
```

**Body:**
```json
{
  "content": "Great point, let me elaborate...",
  "workspace_id": "ws-acme"
}
```

Creates a threaded reply. Automatically updates the parent message's `thread_reply_count`, `thread_last_reply_at`, and `thread_participant_ids`.
