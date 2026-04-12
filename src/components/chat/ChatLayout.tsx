import { ChatProvider } from './ChatContext';
import { ChatSidebar } from './ChatSidebar';
import { ChannelHeader } from './ChannelHeader';
import { MessageFeed } from './MessageFeed';
import { MessageComposer } from './MessageComposer';
import { ThreadPanel } from './ThreadPanel';
import { AIPanel } from './AIPanel';
import { SearchModal } from './SearchModal';
import { useChatContext } from './ChatContext';

function ChatLayoutInner() {
  const { activeChannelId, rightPanel } = useChatContext();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChannelHeader />
        <MessageFeed />
        <MessageComposer channelId={activeChannelId} />
      </div>

      {/* Right panels */}
      {rightPanel === 'thread' && <ThreadPanel />}
      {rightPanel === 'ai' && <AIPanel />}

      {/* Search */}
      <SearchModal />
    </div>
  );
}

export function ChatLayout() {
  return (
    <ChatProvider>
      <ChatLayoutInner />
    </ChatProvider>
  );
}
