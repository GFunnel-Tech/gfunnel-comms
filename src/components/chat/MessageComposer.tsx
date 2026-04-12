import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChatContext } from './ChatContext';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Code, Paperclip, Smile, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageComposerProps {
  channelId: string;
  threadParentId?: string;
  placeholder?: string;
}

export function MessageComposer({ channelId, threadParentId, placeholder }: MessageComposerProps) {
  const { sendMessage, channels } = useChatContext();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const channel = channels.find(c => c.id === channelId);
  const defaultPlaceholder = channel
    ? channel.type === 'dm' ? `Message ${channel.name}` : `Message #${channel.name}`
    : 'Type a message...';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    sendMessage(trimmed, channelId, threadParentId);
    setValue('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          rows={1}
          className="w-full px-3 pt-3 pb-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Italic className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Code className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Paperclip className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Smile className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button size="icon" className={cn('h-7 w-7', value.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
            disabled={!value.trim()} onClick={handleSend}>
            <SendHorizonal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
