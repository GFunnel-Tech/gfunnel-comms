import { useState, useRef, useEffect, useCallback, KeyboardEvent, DragEvent } from 'react';
import { useChatContext } from './ChatContext';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Code, Paperclip, Smile, SendHorizonal, X, FileIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPicker } from './EmojiPicker';
import { TypingIndicator } from './TypingIndicator';
import { MentionAutocomplete } from './MentionAutocomplete';
import type { ChatUser } from '@/data/chat-types';

interface FilePreview {
  file: File;
  preview?: string;
  id: string;
}

interface MessageComposerProps {
  channelId: string;
  threadParentId?: string;
  placeholder?: string;
}

export function MessageComposer({ channelId, threadParentId, placeholder }: MessageComposerProps) {
  const { sendMessage, channels, users } = useChatContext();
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

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

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    };
  }, [files]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const additions: FilePreview[] = Array.from(newFiles).slice(0, 10 - files.length).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }));
    setFiles(prev => [...prev, ...additions]);
  }, [files.length]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleSend = async () => {
    const trimmed = value.trim();
    if ((!trimmed && files.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const fileObjects = files.length > 0 ? files.map(f => f.file) : undefined;
      const content = trimmed || (files.length > 0 ? files.map(f => f.file.name).join(', ') : '');

      await sendMessage(content, channelId, threadParentId, fileObjects);
      setValue('');
      setFiles([]);
      textareaRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.slice(0, start) + emoji + value.slice(end);
      setValue(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setValue(prev => prev + emoji);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    setValue(newValue);
    setTimeout(() => {
      if (selected) {
        textarea.selectionStart = start;
        textarea.selectionEnd = end + prefix.length + suffix.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
      }
      textarea.focus();
    }, 0);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const hasContent = value.trim() || files.length > 0;

  return (
    <div
      className="px-4 pb-3 pt-1 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 mx-4 mb-3 mt-1 rounded-lg border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">Drop files here to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Max 10 files</p>
          </div>
        </div>
      )}

      {/* Typing indicator */}
      <TypingIndicator channelId={channelId} />

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* File previews */}
        {files.length > 0 && (
          <div className="px-3 pt-3 flex flex-wrap gap-2">
            {files.map(f => (
              <div key={f.id} className="relative group">
                {f.preview ? (
                  <div className="w-20 h-20 rounded-md overflow-hidden border border-border bg-muted">
                    <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-40 px-3 py-2 rounded-md border border-border bg-muted/50 flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">{f.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.file.size < 1024 ? `${f.file.size} B` :
                         f.file.size < 1048576 ? `${(f.file.size / 1024).toFixed(1)} KB` :
                         `${(f.file.size / 1048576).toFixed(1)} MB`}
                      </p>
                    </div>
                  </div>
                )}
                <button
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(f.id)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          rows={1}
          disabled={isSending}
          className="w-full px-3 pt-3 pb-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5 relative">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
              onClick={() => insertMarkdown('**', '**')} disabled={isSending}>
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
              onClick={() => insertMarkdown('_', '_')} disabled={isSending}>
              <Italic className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
              onClick={() => insertMarkdown('`', '`')} disabled={isSending}>
              <Code className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
              onClick={() => fileInputRef.current?.click()} disabled={isSending}>
              <Paperclip className="w-3.5 h-3.5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.mp4,.mp3"
            />
            <div className="relative">
              <Button variant="ghost" size="icon" className={cn('h-7 w-7', showEmoji ? 'text-primary' : 'text-muted-foreground')}
                onClick={() => setShowEmoji(!showEmoji)} disabled={isSending}>
                <Smile className="w-3.5 h-3.5" />
              </Button>
              {showEmoji && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>
          </div>
          <Button size="icon" className={cn('h-7 w-7', hasContent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
            disabled={!hasContent || isSending} onClick={handleSend}>
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
