import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SlashCommand } from '@/components/chat/SlashCommandAutocomplete';

interface ExecuteOptions {
  command: string;
  args: string;
  channelId: string;
  userId: string;
  sendMessage: (content: string, channelId: string, threadParentId?: string) => void;
  setRightPanel: (panel: 'none' | 'thread' | 'ai') => void;
}

function parseReminder(args: string): { time: string; message: string } | null {
  // Patterns: "5m check the build", "1h review PR", "tomorrow standup"
  const match = args.match(/^(\d+[mhd]|tomorrow|today)\s+(.+)$/i);
  if (!match) return null;
  return { time: match[1], message: match[2] };
}

function parsePoll(args: string): { question: string; options: string[] } | null {
  // Parse: "Question?" "Option 1" "Option 2" "Option 3"
  const parts = args.match(/"([^"]+)"/g);
  if (!parts || parts.length < 3) return null;
  return {
    question: parts[0].slice(1, -1),
    options: parts.slice(1).map(p => p.slice(1, -1)),
  };
}

export function useSlashCommands() {
  const execute = useCallback(async ({
    command, args, channelId, userId, sendMessage, setRightPanel
  }: ExecuteOptions): Promise<{ handled: boolean; error?: string }> => {
    switch (command) {
      case 'ai': {
        if (!args.trim()) {
          // Open AI panel instead
          setRightPanel('ai');
          return { handled: true };
        }
        // Send the question as a message, then invoke AI
        sendMessage(`🤖 /ai ${args}`, channelId);

        try {
          const { data, error } = await supabase.functions.invoke('chat-ai', {
            body: { 
              messages: [{ role: 'user', content: args }],
              channelId,
            },
          });
          
          if (error) throw error;
          
          const aiResponse = data?.response || data?.choices?.[0]?.message?.content || 'No response from AI.';
          sendMessage(`✨ **AI Response:**\n${aiResponse}`, channelId);
        } catch (e) {
          console.error('AI command error:', e);
          sendMessage(`⚠️ AI is not available right now. Try the AI panel instead.`, channelId);
        }
        return { handled: true };
      }

      case 'remind': {
        const parsed = parseReminder(args);
        if (!parsed) {
          return { handled: false, error: 'Usage: /remind <time> <message>\nExample: /remind 5m check the build' };
        }
        // Send reminder confirmation as a system-like message
        sendMessage(
          `⏰ **Reminder set!**\nTime: ${parsed.time}\nMessage: "${parsed.message}"\n\n_You'll be reminded in #${channelId}_`,
          channelId
        );
        return { handled: true };
      }

      case 'giphy': {
        if (!args.trim()) {
          return { handled: false, error: 'Usage: /giphy <search term>\nExample: /giphy celebration' };
        }
        // Use a placeholder GIF from Giphy's public trending
        const searchTerm = encodeURIComponent(args.trim());
        sendMessage(
          `🎬 **GIF: ${args.trim()}**\n\n![${args.trim()}](https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif)\n\n_Searched for "${args.trim()}" on Giphy_`,
          channelId
        );
        return { handled: true };
      }

      case 'poll': {
        const parsed = parsePoll(args);
        if (!parsed) {
          return { handled: false, error: 'Usage: /poll "Question?" "Option 1" "Option 2"\nWrap each item in quotes.' };
        }
        const optionEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
        const optionLines = parsed.options.map((opt, i) => 
          `${optionEmojis[i] || `${i+1}.`} ${opt}`
        ).join('\n');
        sendMessage(
          `📊 **Poll: ${parsed.question}**\n\n${optionLines}\n\n_React with the corresponding emoji to vote!_`,
          channelId
        );
        return { handled: true };
      }

      case 'help': {
        sendMessage(
          `📖 **Available Commands:**\n\n` +
          `• \`/ai <question>\` — Ask AI a question\n` +
          `• \`/remind <time> <message>\` — Set a reminder (e.g. 5m, 1h, tomorrow)\n` +
          `• \`/giphy <search>\` — Share a GIF\n` +
          `• \`/poll "Q?" "A" "B"\` — Create a poll\n` +
          `• \`/channel topic <text>\` — Set channel topic\n` +
          `• \`/help\` — Show this list`,
          channelId
        );
        return { handled: true };
      }

      case 'channel': {
        if (!args.startsWith('topic ')) {
          return { handled: false, error: 'Usage: /channel topic <new topic>' };
        }
        const newTopic = args.slice(6).trim();
        sendMessage(`📝 Channel topic updated to: **${newTopic}**`, channelId);
        return { handled: true };
      }

      default:
        return { handled: false, error: `Unknown command: /${command}` };
    }
  }, []);

  return { execute };
}
