import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function ChatInput() {
  const { sendMessage, isStreaming } = useChat();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

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
    sendMessage(text);
    setText('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  }, [text, isStreaming, sendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const hasText = text.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-border bg-card p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Molly đang trả lời...' : 'Nhập tin nhắn...'}
          disabled={isStreaming}
          rows={1}
          maxLength={500}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!hasText || isStreaming}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-150 ${
            hasText && !isStreaming
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label="Gửi tin nhắn"
        >
          <ArrowUp className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
