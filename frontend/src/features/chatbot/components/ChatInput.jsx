import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Headphones, MessageCircle, ArrowLeft } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function ChatInput() {
  const {
    sendMessage, sendAdvisorReply, isStreaming,
    linkedTicket, allowLeadHandoff, leadTriggered, triggerLeadForm
  } = useChat();
  const [text, setText] = useState('');
  const [replyMode, setReplyMode] = useState(false); // Explicit advisor reply mode
  const textareaRef = useRef(null);

  const hasTicketLink = !!linkedTicket?.ticketId;

  // Show contact button: allowed + not already showing form + no ticket linked yet
  const showContactButton = allowLeadHandoff && !leadTriggered && !hasTicketLink;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '48px';
    const scrollHeight = el.scrollHeight;
    el.style.height = `${Math.min(scrollHeight, 120)}px`;
  }, [text]);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || isStreaming) return;

    if (replyMode && hasTicketLink && sendAdvisorReply) {
      sendAdvisorReply(text);
    } else {
      sendMessage(text);
    }

    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  }, [text, isStreaming, replyMode, hasTicketLink, sendMessage, sendAdvisorReply]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const hasText = text.trim().length > 0;

  const placeholder = isStreaming
    ? 'Molly đang trả lời...'
    : replyMode
      ? 'Trả lời tư vấn viên...'
      : 'Nhập tin nhắn...';

  return (
    <div className="shrink-0 border-t border-border bg-white dark:bg-zinc-950 p-3">
      {/* Reply mode indicator + toggle */}
      {hasTicketLink && (
        <div className="mb-2 flex items-center gap-2">
          {replyMode ? (
            <button
              onClick={() => setReplyMode(false)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="font-medium">Đang trả lời tư vấn viên</span>
              <span className="text-indigo-400">·</span>
              <span>Ticket #{linkedTicket.ticketNumber}</span>
              <span className="text-indigo-400 ml-1">← Nhấn để quay về Molly</span>
            </button>
          ) : (
            <button
              onClick={() => setReplyMode(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              <span className="font-medium">Ticket #{linkedTicket.ticketNumber}</span>
              <span className="text-emerald-500">·</span>
              <span>Nhấn để trả lời tư vấn viên</span>
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Contact advisor button (only before ticket is linked) */}
        {showContactButton && (
          <button
            onClick={triggerLeadForm}
            title="Liên hệ tư vấn viên"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-all duration-150 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-700"
          >
            <Headphones className="h-4 w-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          rows={1}
          maxLength={500}
          className={`flex-1 resize-none rounded-xl border bg-white dark:bg-zinc-900 dark:text-foreground px-3.5 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            replyMode
              ? 'border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300/30'
              : 'border-border focus:border-primary focus:ring-primary/30'
          }`}
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!hasText || isStreaming}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-150 ${
            hasText && !isStreaming
              ? replyMode
                ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label={replyMode ? 'Gửi phản hồi cho tư vấn viên' : 'Gửi tin nhắn'}
        >
          <ArrowUp className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
