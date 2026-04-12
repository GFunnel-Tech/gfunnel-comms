import { useGFunnel } from '@/hooks/useGFunnel';
import { ChatLayout } from '@/components/chat/ChatLayout';

const Index = () => {
  const { isReady, isEmbedded } = useGFunnel('gfunnel-chat');

  if (isEmbedded && !isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <ChatLayout />;
};

export default Index;
