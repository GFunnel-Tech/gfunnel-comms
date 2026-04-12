import { ChatUser, ChatChannel, ChatMessage } from './chat-types';

const WS = 'demo-workspace';

export const demoUsers: ChatUser[] = [
  { id: 'user-1', display_name: 'Cameron G.', avatar_url: null, email: 'cameron@gfunnel.com', status: 'online', status_text: 'Building things' },
  { id: 'user-2', display_name: 'Sarah Chen', avatar_url: null, email: 'sarah@gfunnel.com', status: 'online' },
  { id: 'user-3', display_name: 'Tim Miller', avatar_url: null, email: 'tim@gfunnel.com', status: 'away', status_text: 'In a meeting' },
  { id: 'user-4', display_name: 'Alex Rivera', avatar_url: null, email: 'alex@gfunnel.com', status: 'offline' },
  { id: 'user-5', display_name: 'Jordan Lee', avatar_url: null, email: 'jordan@gfunnel.com', status: 'dnd', status_text: 'Deep work' },
];

export const currentDemoUser = demoUsers[0];

export const demoChannels: ChatChannel[] = [
  {
    id: 'ch-general', workspace_id: WS, name: 'general', description: 'General discussion for the team',
    type: 'public', created_by: 'user-1', is_archived: false,
    member_ids: ['user-1','user-2','user-3','user-4','user-5'],
    pinned_message_ids: ['msg-g-3'], last_message_at: '2026-04-12T08:30:00Z',
    last_message_preview: 'Sounds great, let\'s sync up later!',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-12T08:30:00Z', unread_count: 3,
  },
  {
    id: 'ch-announce', workspace_id: WS, name: 'announcements', description: 'Important company announcements',
    type: 'public', created_by: 'user-1', is_archived: false,
    member_ids: ['user-1','user-2','user-3','user-4','user-5'],
    pinned_message_ids: [], last_message_at: '2026-04-11T14:00:00Z',
    last_message_preview: 'New feature launch next week!',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-11T14:00:00Z', unread_count: 0,
  },
  {
    id: 'ch-random', workspace_id: WS, name: 'random', description: 'Off-topic fun and watercooler chat',
    type: 'public', created_by: 'user-2', is_archived: false,
    member_ids: ['user-1','user-2','user-3','user-4','user-5'],
    pinned_message_ids: [], last_message_at: '2026-04-12T07:15:00Z',
    last_message_preview: 'Anyone seen that new show?',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-12T07:15:00Z', unread_count: 1,
  },
  {
    id: 'dm-sarah', workspace_id: WS, name: 'Sarah Chen',
    type: 'dm', created_by: 'user-1', is_archived: false,
    member_ids: ['user-1','user-2'], pinned_message_ids: [],
    last_message_at: '2026-04-12T09:00:00Z',
    last_message_preview: 'Can you review the PR?',
    created_at: '2026-03-01T00:00:00Z', updated_at: '2026-04-12T09:00:00Z', unread_count: 1,
  },
  {
    id: 'dm-tim', workspace_id: WS, name: 'Tim Miller',
    type: 'dm', created_by: 'user-3', is_archived: false,
    member_ids: ['user-1','user-3'], pinned_message_ids: [],
    last_message_at: '2026-04-11T16:30:00Z',
    last_message_preview: 'Thanks for the update!',
    created_at: '2026-03-15T00:00:00Z', updated_at: '2026-04-11T16:30:00Z', unread_count: 0,
  },
];

function msg(id: string, channelId: string, userId: string, content: string, createdAt: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  const user = demoUsers.find(u => u.id === userId)!;
  return {
    id, workspace_id: WS, channel_id: channelId, user_id: userId,
    user_display_name: user.display_name, user_avatar_url: user.avatar_url,
    content, type: 'text', thread_reply_count: 0, is_edited: false,
    is_deleted: false, pinned: false, reactions: {}, mentions: [],
    created_at: createdAt, updated_at: createdAt, ...extra,
  };
}

export const demoMessages: ChatMessage[] = [
  // #general
  msg('msg-g-1', 'ch-general', 'user-1', 'Good morning team! 🌅 Ready for another productive day?', '2026-04-12T07:00:00Z'),
  msg('msg-g-2', 'ch-general', 'user-2', 'Morning! I just pushed the latest design updates to the staging branch.', '2026-04-12T07:05:00Z', {
    reactions: { '👍': ['user-1', 'user-3'], '🎉': ['user-4'] }
  }),
  msg('msg-g-3', 'ch-general', 'user-1', 'Great work Sarah! The new dashboard looks amazing. Let me share this with the stakeholders.', '2026-04-12T07:08:00Z', {
    pinned: true, pinned_by: 'user-1',
    thread_reply_count: 3, thread_last_reply_at: '2026-04-12T07:30:00Z',
  }),
  msg('msg-g-4', 'ch-general', 'user-3', 'I\'ll be in a meeting from 10-11 but available after that for the sync.', '2026-04-12T07:15:00Z'),
  msg('msg-g-5', 'ch-general', 'user-3', 'Also, has anyone looked into the caching issue from yesterday?', '2026-04-12T07:16:00Z'),
  msg('msg-g-6', 'ch-general', 'user-5', 'I spent some time on the caching issue. It turns out the Redis connection pool was maxing out during peak hours. I\'ve adjusted the pool size and added connection retry logic.', '2026-04-12T07:25:00Z', {
    reactions: { '🔥': ['user-1', 'user-2', 'user-3'] }
  }),
  msg('msg-g-7', 'ch-general', 'user-4', 'Nice catch Jordan! I noticed the same thing in the logs but didn\'t have time to dig into it.', '2026-04-12T07:30:00Z'),
  msg('msg-g-8', 'ch-general', 'user-2', 'Quick update: the design system docs are now live at /docs/design. Please take a look and let me know if anything needs adjusting.', '2026-04-12T08:00:00Z', {
    reactions: { '👀': ['user-1', 'user-3', 'user-5'] }
  }),
  msg('msg-g-9', 'ch-general', 'user-1', 'Just had a call with the client — they love the new onboarding flow! Huge kudos to everyone involved. 🏆', '2026-04-12T08:15:00Z', {
    reactions: { '🎉': ['user-2', 'user-3', 'user-4', 'user-5'], '❤️': ['user-2'] }
  }),
  msg('msg-g-10', 'ch-general', 'user-4', 'Sounds great, let\'s sync up later!', '2026-04-12T08:30:00Z'),

  // #general thread replies on msg-g-3
  msg('msg-g-t1', 'ch-general', 'user-2', 'Thanks! I focused on the data visualization components.', '2026-04-12T07:12:00Z', { thread_parent_id: 'msg-g-3' }),
  msg('msg-g-t2', 'ch-general', 'user-4', 'The chart animations are really smooth 👏', '2026-04-12T07:20:00Z', { thread_parent_id: 'msg-g-3' }),
  msg('msg-g-t3', 'ch-general', 'user-1', 'Stakeholders confirmed — they want to ship it next week!', '2026-04-12T07:30:00Z', { thread_parent_id: 'msg-g-3' }),

  // #announcements
  msg('msg-a-1', 'ch-announce', 'user-1', '📢 **Company All-Hands** this Friday at 3 PM. We\'ll be covering Q1 results and Q2 roadmap.', '2026-04-10T09:00:00Z', {
    reactions: { '👍': ['user-2', 'user-3', 'user-4', 'user-5'] }
  }),
  msg('msg-a-2', 'ch-announce', 'user-1', '🚀 **New Feature Launch**: The AI Assistant module is going live next Monday! Please test it on staging this week.', '2026-04-11T14:00:00Z', {
    reactions: { '🎉': ['user-2', 'user-3'], '🚀': ['user-4', 'user-5'] },
    thread_reply_count: 2, thread_last_reply_at: '2026-04-11T15:00:00Z',
  }),
  msg('msg-a-t1', 'ch-announce', 'user-2', 'I\'ll run through the QA checklist today', '2026-04-11T14:30:00Z', { thread_parent_id: 'msg-a-2' }),
  msg('msg-a-t2', 'ch-announce', 'user-5', 'Edge cases documented in the wiki', '2026-04-11T15:00:00Z', { thread_parent_id: 'msg-a-2' }),

  // #random
  msg('msg-r-1', 'ch-random', 'user-4', 'Has anyone tried the new coffee place on 5th? ☕', '2026-04-11T12:00:00Z'),
  msg('msg-r-2', 'ch-random', 'user-2', 'Yes! Their oat milk latte is incredible.', '2026-04-11T12:05:00Z', { reactions: { '☕': ['user-4'] } }),
  msg('msg-r-3', 'ch-random', 'user-3', 'Adding it to my list. Also, anyone down for a board game night this weekend?', '2026-04-11T12:10:00Z'),
  msg('msg-r-4', 'ch-random', 'user-5', 'I\'m in! 🎲', '2026-04-11T12:12:00Z'),
  msg('msg-r-5', 'ch-random', 'user-1', 'Count me in too. Should we do Saturday or Sunday?', '2026-04-11T12:15:00Z'),
  msg('msg-r-6', 'ch-random', 'user-3', 'Saturday works better. I\'ll send a calendar invite.', '2026-04-11T12:20:00Z', {
    reactions: { '👍': ['user-1', 'user-4', 'user-5'] }
  }),
  msg('msg-r-7', 'ch-random', 'user-4', 'Anyone seen that new show on Netflix? The sci-fi one everyone\'s talking about?', '2026-04-12T07:15:00Z'),

  // DM with Sarah
  msg('msg-dm-s1', 'dm-sarah', 'user-2', 'Hey Cameron, do you have a minute to review the component library PR?', '2026-04-12T08:45:00Z'),
  msg('msg-dm-s2', 'dm-sarah', 'user-1', 'Sure, send me the link!', '2026-04-12T08:47:00Z'),
  msg('msg-dm-s3', 'dm-sarah', 'user-2', 'Here it is: PR #247 — it\'s the new Button variants and the updated Card component.', '2026-04-12T08:50:00Z'),
  msg('msg-dm-s4', 'dm-sarah', 'user-1', 'Looking at it now. The hover states look great!', '2026-04-12T08:55:00Z'),
  msg('msg-dm-s5', 'dm-sarah', 'user-2', 'Can you review the PR?', '2026-04-12T09:00:00Z'),

  // DM with Tim
  msg('msg-dm-t1', 'dm-tim', 'user-1', 'Hey Tim, how\'s the API integration going?', '2026-04-11T15:00:00Z'),
  msg('msg-dm-t2', 'dm-tim', 'user-3', 'Going well! I finished the auth endpoints. Working on the webhook handlers now.', '2026-04-11T15:15:00Z'),
  msg('msg-dm-t3', 'dm-tim', 'user-1', 'Awesome. Let me know if you need help with the webhook payload validation.', '2026-04-11T16:00:00Z'),
  msg('msg-dm-t4', 'dm-tim', 'user-3', 'Thanks for the update!', '2026-04-11T16:30:00Z'),

  // System message
  { id: 'msg-sys-1', workspace_id: WS, channel_id: 'ch-general', user_id: 'system', user_display_name: 'System', user_avatar_url: null, content: 'Jordan Lee joined #general', type: 'system', thread_reply_count: 0, is_edited: false, is_deleted: false, pinned: false, reactions: {}, mentions: [], created_at: '2026-04-09T10:00:00Z', updated_at: '2026-04-09T10:00:00Z' },
];

export function getUserById(id: string): ChatUser | undefined {
  return demoUsers.find(u => u.id === id);
}

export function getChannelMessages(channelId: string): ChatMessage[] {
  return demoMessages
    .filter(m => m.channel_id === channelId && !m.thread_parent_id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getThreadReplies(parentId: string): ChatMessage[] {
  return demoMessages
    .filter(m => m.thread_parent_id === parentId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
