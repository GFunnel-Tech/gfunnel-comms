# Events API (Outgoing)

Subscribe to real-time events via HTTP callbacks — similar to Slack Event Subscriptions.

## Available Event Types

```
GET /chat-events
```

| Event | Description |
|-------|-------------|
| `message.created` | A new message was posted |
| `message.updated` | A message was edited |
| `message.deleted` | A message was deleted |
| `reaction.added` | A reaction was added |
| `reaction.removed` | A reaction was removed |
| `channel.created` | A new channel was created |
| `channel.updated` | A channel was updated |
| `channel.archived` | A channel was archived |
| `member.joined` | A user joined a channel |
| `member.left` | A user left a channel |
| `thread.reply` | A reply was posted in a thread |
| `presence.changed` | A user's presence status changed |

## Create Event Subscription

```
POST /chat-api/events
```

**Body:**
```json
{
  "workspace_id": "ws-acme",
  "api_key_id": "uuid-of-your-api-key",
  "callback_url": "https://your-server.com/gfunnel-events",
  "events": ["message.created", "reaction.added"]
}
```

## Event Payload

When an event occurs, GFunnel sends a POST to your callback URL:

```json
{
  "type": "message.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": "msg-uuid",
    "channel_id": "ch-uuid",
    "user_id": "user-uuid",
    "content": "Hello team!",
    "workspace_id": "ws-acme"
  }
}
```

### Signature Verification

Every event includes an HMAC-SHA256 signature in the `X-GFunnel-Signature` header:

```
X-GFunnel-Signature: sha256=abc123...
X-GFunnel-Event: message.created
X-GFunnel-Timestamp: 2025-01-15T10:30:00Z
```

Verify it with your subscription's `signing_secret`:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `sha256=${expected}` === signature;
}
```

```python
import hmac, hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return f"sha256={expected}" == signature
```

## Failure Handling

- Failed deliveries increment `failure_count`
- After **10 consecutive failures**, the subscription is automatically disabled
- Successful delivery resets `failure_count` to 0

## List Subscriptions

```
GET /chat-api/events
```

## Delete Subscription

```
DELETE /chat-api/events/:id
```
