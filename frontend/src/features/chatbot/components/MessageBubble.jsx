import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { GraduationCap, MessageSquarePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MessageActions from './MessageActions';

const markdownComponents = {
  // Override default elements for chat-friendly rendering
  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-1 ml-4 list-disc last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1 ml-4 list-decimal last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
      {children}
    </a>
  ),
  code: ({ inline, children }) =>
    inline
      ? <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{children}</code>
      : <pre className="my-1 overflow-x-auto rounded bg-muted p-2 text-xs"><code>{children}</code></pre>,
  table: ({ children }) => (
    <div className="my-1 overflow-x-auto">
      <table className="min-w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-border bg-muted px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
};

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

const MessageBubble = memo(function MessageBubble({
  message,
  isLastAssistant,
  onCopy,
  onRegenerate,
  onEdit,
  onRate
}) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isAssistant = message.role === 'assistant';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const textareaRef = useRef(null);

  const handleStartEdit = useCallback(() => {
    setEditText(message.content);
    setIsEditing(true);
  }, [message.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText('');
  }, []);

  const handleSubmitEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.(message.id, trimmed);
    }
    setIsEditing(false);
    setEditText('');
  }, [editText, message.content, message.id, onEdit]);

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    }
  }, [handleCancelEdit, handleSubmitEdit]);

  // Auto-resize textarea + focus
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing, editText]);

  const showActions = !message.isStreaming && !isError && !message.isSessionCap && (isUser || isAssistant);

  if (isUser) {
    return (
      <div className="group flex justify-end animate-in slide-in-from-right-2 duration-150">
        <div className="max-w-[80%]">
          {isEditing ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full min-h-[60px] max-h-[120px] resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                rows={1}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitEdit}
                  disabled={!editText.trim() || editText.trim() === message.content}
                  className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Gửi lại
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl rounded-br-md bg-primary/10 px-3.5 py-2.5 text-sm text-foreground">
                {message.content}
              </div>
              <div className="mt-0.5 flex items-center justify-end gap-1.5">
                <p className="text-[10px] text-muted-foreground">
                  {formatTime(message.timestamp)}
                </p>
              </div>
              {showActions && (
                <div className="mt-0.5 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                  <MessageActions
                    message={message}
                    onCopy={onCopy}
                    onEdit={handleStartEdit}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Error message
  if (isError) {
    return (
      <div className="flex gap-2 animate-in fade-in duration-200">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-1">
          <GraduationCap className="h-3.5 w-3.5 text-destructive" />
        </div>
        <div className="max-w-[80%]">
          <div className="rounded-2xl rounded-bl-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive-foreground border border-destructive/20">
            <p>{message.content}</p>
            {message.isNetworkError && (
              <button
                onClick={message.onRetry}
                className="mt-1.5 text-xs font-medium text-primary hover:underline"
              >
                Thử lại
              </button>
            )}
            {message.errorCode === 'service_unavailable' && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Bạn có thể liên hệ tư vấn viên qua form bên dưới.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Session cap message — enhanced with CTA
  if (message.isSessionCap) {
    return (
      <div className="flex gap-2 animate-in fade-in duration-200">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-1">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-bl-md border border-border bg-slate-50 px-3.5 py-3 text-sm">
            <p className="font-medium text-foreground">Cuộc trò chuyện đã đạt giới hạn</p>
            <p className="mt-1 text-muted-foreground">Bạn có thể bắt đầu cuộc trò chuyện mới hoặc liên hệ tư vấn viên trực tiếp!</p>
            <button
              onClick={message.onNewConversation}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Trò chuyện mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="group flex gap-2 animate-in fade-in duration-200">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
        <GraduationCap className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm">
          {message.isStreaming && !message.content ? (
            <TypingDots />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
        {!message.isStreaming && (
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-[10px] text-muted-foreground">
              {formatTime(message.timestamp)}
            </p>
          </div>
        )}
        {showActions && (
          <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <MessageActions
              message={message}
              onCopy={onCopy}
              onRegenerate={onRegenerate}
              onRate={onRate}
              isLast={isLastAssistant}
            />
          </div>
        )}
      </div>
    </div>
  );
});

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '200ms' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '400ms' }} />
    </div>
  );
}

export default MessageBubble;
