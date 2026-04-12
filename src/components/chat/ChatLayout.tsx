import { useRef, useState } from 'react';
import { ChatProvider } from './ChatContext';
import { ChatSidebar } from './ChatSidebar';
import { ChannelHeader } from './ChannelHeader';
import { ChannelTabBar } from './ChannelTabBar';
import { MessageFeed } from './MessageFeed';
import { MessageComposer } from './MessageComposer';
import { ThreadPanel } from './ThreadPanel';
import { AIPanel } from './AIPanel';
import { SearchModal } from './SearchModal';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { WorkspaceRail } from './WorkspaceRail';
import { useChatContext } from './ChatContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ActiveTabContext } from './ActiveTabContext';

function ChatLayoutInner() {
  const {
    activeChannelId, rightPanel, mobileSidebarOpen, setMobileSidebarOpen, setRightPanel,
    workspaces, activeWorkspaceId, switchWorkspace,
    reorderWorkspaces, workspaceFolders, createWorkspaceFolder, removeWorkspaceFromFolder, deleteWorkspaceFolder, renameWorkspaceFolder,
  } = useChatContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const showRail = useMediaQuery('(min-width: 900px)');
  const [activeTab, setActiveTab] = useState('messages');

  useSwipeGesture(containerRef, {
    onSwipeRight: () => setMobileSidebarOpen(true),
    onSwipeLeft: () => {
      if (mobileSidebarOpen) setMobileSidebarOpen(false);
    },
    threshold: 50,
    edgeWidth: 30,
  });

  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      <div ref={containerRef} className="flex h-screen bg-background overflow-hidden relative">
        {/* Workspace Rail — visible on wide screens */}
        {showRail && (
          <WorkspaceRail
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSwitch={switchWorkspace}
            onReorder={reorderWorkspaces}
            folders={workspaceFolders}
            onCreateFolder={createWorkspaceFolder}
            onRemoveFromFolder={removeWorkspaceFromFolder}
            onDeleteFolder={deleteWorkspaceFolder}
            onRenameFolder={renameWorkspaceFolder}
          />
        )}

        {/* Mobile overlay backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden'}
          md:relative md:flex md:z-auto
        `}>
          <ChatSidebar />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChannelHeader />
          <ChannelTabBar />
          {activeTab === 'messages' && (
            <>
              <MessageFeed />
              <MessageComposer channelId={activeChannelId} />
            </>
          )}
        </div>

        {/* Right panels */}
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

        <SearchModal />
        <KeyboardShortcutsDialog />
      </div>
    </ActiveTabContext.Provider>
  );
}

export function ChatLayout() {
  return (
    <ChatProvider>
      <ChatLayoutInner />
    </ChatProvider>
  );
}
