import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GraduationCap, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import LeadCaptureCard from './LeadCaptureCard';

function WelcomeMessage() {
  const { mode, chatMode, userName } = useChat();

  const greeting = mode === 'student' && userName
    ? `Chào ${userName}! 👋`
    : 'Chào bạn! 👋';

  const subtitle = chatMode === 'student-guidance'
    ? 'Mình là Molly — trợ lý AI của Skill Master. Mình có thể giúp bạn xem lịch học, kết quả, lộ trình học và các bước tiếp theo.'
    : chatMode === 'parent-guidance'
      ? 'Mình là Molly — trợ lý AI của Skill Master. Mình có thể hỗ trợ phụ huynh tìm lộ trình phù hợp và hiểu rõ tiến trình học của con.'
      : 'Mình là Molly — trợ lý AI của Skill Master Academy. Mình có thể giúp bạn tìm hiểu khóa học, học phí và gợi ý lộ trình phù hợp!';

  return (
    <div className="flex flex-col items-center px-4 pb-4 pt-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <GraduationCap className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{greeting}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-[280px]">{subtitle}</p>
    </div>
  );
}

export default function ChatMessages() {
  const {
    messages,
    isStreaming,
    retryLastMessage,
    copyMessage,
    rateMessage,
    regenerateResponse,
    editAndResend,
    createConversation,
    pageContext
  } = useChat();
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);

  // Find the last assistant message ID
  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && !messages[i].isStreaming) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // Check if user is at bottom
  const handleScroll = useCallback((e) => {
    const target = e?.target;
    if (!target) return;
    const threshold = 60;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    isAtBottomRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  // Auto-scroll when new messages arrive (only if at bottom)
  useEffect(() => {
    if (isAtBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, []);

  // Edit handler: editAndResend takes (messageId, newText)
  const handleEdit = useCallback((messageId, newText) => {
    editAndResend(messageId, newText);
  }, [editAndResend]);

  // Enhance error/session-cap messages with handlers
  const enhancedMessages = messages.map(msg => {
    if (msg.isError && msg.isNetworkError) {
      return { ...msg, onRetry: retryLastMessage };
    }
    if (msg.isSessionCap) {
      return { ...msg, onNewConversation: createConversation };
    }
    return msg;
  });

  return (
    <div className="relative flex-1 overflow-hidden">
      <ScrollArea
        className="h-full"
        onScrollCapture={handleScroll}
        ref={scrollRef}
      >
        <div className="flex flex-col gap-3 p-4">
          <WelcomeMessage />

          <SuggestionChips pageContext={pageContext} />

          {enhancedMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLastAssistant={msg.id === lastAssistantId}
              onCopy={copyMessage}
              onRegenerate={regenerateResponse}
              onEdit={handleEdit}
              onRate={rateMessage}
            />
          ))}

          <LeadCaptureCard />

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-white border border-border px-3 py-1.5 text-xs text-muted-foreground shadow-md transition-all hover:bg-muted animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <ArrowDown className="h-3 w-3" />
          Tin nhắn mới
        </button>
      )}
    </div>
  );
}
