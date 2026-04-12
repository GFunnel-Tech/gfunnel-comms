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
  const { activeChannelId, rightPanel, mobileSidebarOpen, setMobileSidebarOpen } = useChatContext();

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar: hidden on mobile unless open, icon-rail on md, full on lg+ */}
      <div className={`
        ${mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden'}
        md:relative md:flex md:z-auto
      `}>
        <ChatSidebar />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChannelHeader />
        <MessageFeed />
        <MessageComposer channelId={activeChannelId} />
      </div>

      {/* Right panels - overlay on small screens, inline on large */}
      {rightPanel === 'thread' && (
        <div className="fixed inset-y-0 right-0 z-30 w-80 lg:relative lg:z-auto">
          <ThreadPanel />
        </div>
      )}
      {rightPanel === 'ai' && (
        <div className="fixed inset-y-0 right-0 z-30 w-80 lg:relative lg:z-auto">
          <AIPanel />
        </div>
      )}

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
