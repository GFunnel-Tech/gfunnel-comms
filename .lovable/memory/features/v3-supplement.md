---
name: V3 supplement changes
description: Two changes from v3 supplement — remove Open Module from header, add workspace switcher rail
type: feature
---

## CHANGE 1 — Remove "Open Module" from Channel Header
Header should only contain:
- Left: [emoji] [#name] (bold) [topic] (muted, truncated, click to edit)
- Right: [🔍 Search] [📌 Pinned] [👥 Members] [⚡ Ask AI] [⋮ More]
Context linking stays on individual messages (chip pills) and in channel settings only.

## CHANGE 2 — Add Workspace Switcher Rail
4-column layout: Rail (56px) | Sidebar (240px) | Main Feed (flex-1) | Right Panel (320px)
- Rail: bg #070714, 40px circle avatars with workspace logo/initials
- Active workspace: 2px solid #F97316 left border, full brightness
- Inactive: 60% opacity, unread orange badge, mention red "!" badge
- New table: chat_workspace_connections (user_id, workspace_id, workspace_name, workspace_type, workspace_logo_url, workspace_color, sort_order, total_unread, has_mention, last_active_at, is_active)
- Responsive: visible ≥900px, hidden <900px (accessible via hamburger/dropdown)
- Demo mode: 3 seeded workspaces (Acme Corp, EMM Marketing, Personal)
- Workspace name dropdown in sidebar for switching on narrow screens
- Bridge additions: requestWorkspaceList(), notifyWorkspaceSwitch(), gfunnel:workspaces handler
