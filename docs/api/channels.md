# Channels API

## List Channels

```
GET /chat-api/channels?workspace_id=<workspace_id>
```

**Response:**
```json
{
  "channels": [
    {
      "id": "uuid",
      "name": "general",
      "description": "Open team communication",
      "type": "public",
      "emoji": "💬",
      "topic": "Daily standup & general chat",
      "workspace_id": "ws-acme",
      "is_archived": false,
      "is_read_only": false,
      "message_count": 142,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

## Get Channel

```
GET /chat-api/channels/:id
```

## Create Channel

```
POST /chat-api/channels
```

**Body:**
```json
{
  "name": "engineering",
  "description": "Engineering team discussions",
  "type": "public",
  "workspace_id": "ws-acme",
  "emoji": "⚙️"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✅ | Channel name |
| workspace_id | string | ✅ | Workspace ID |
| description | string | | Channel description |
| type | string | | `public`, `private`, `announcement`, `department` (default: `public`) |
| emoji | string | | Emoji icon (default: `#`) |

## Update Channel

```
PATCH /chat-api/channels/:id
```

**Body (all fields optional):**
```json
{
  "name": "new-name",
  "description": "Updated description",
  "topic": "New topic",
  "is_archived": false,
  "is_read_only": true,
  "emoji": "🚀"
}
```

## List Channel Messages

```
GET /chat-api/channels/:id/messages?limit=50&before=2025-01-15T10:00:00Z
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 50 | Max messages (1-100) |
| before | string | | ISO timestamp cursor for pagination |

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Hello team!",
      "user_id": "uuid",
      "type": "text",
      "source": "user",
      "reactions": {"👍": ["user-1", "user-2"]},
      "thread_reply_count": 3,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```
