import { useState, useEffect } from 'react';
import { demoUsers } from '@/data/chat-demo-data';

interface TypingIndicatorProps {
  channelId: string;
}

// Simulated typing — in production this would come from Supabase Realtime presence
export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // Simulate random users typing occasionally
    const interval = setInterval(() => {
      const shouldType = Math.random() > 0.85;
      if (shouldType) {
        const randomUser = demoUsers[Math.floor(Math.random() * (demoUsers.length - 1)) + 1];
        setTypingUsers([randomUser.display_name]);
        setTimeout(() => setTypingUsers([]), 2000 + Math.random() * 2000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [channelId]);

  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 h-6">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-[11px] text-muted-foreground">{text}</span>
    </div>
  );
}
