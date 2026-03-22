import { memo, useCallback } from 'react';
import { Copy, RefreshCw, Pencil, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ActionButton = memo(function ActionButton({ icon: Icon, label, onClick, active, activeColor }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            active
              ? `${activeColor || 'text-primary'} bg-primary/10`
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
});

function MessageActions({ message, onCopy, onRegenerate, onEdit, onRate, isLast }) {
  const handleCopy = useCallback(() => {
    onCopy?.(message.content);
  }, [onCopy, message.content]);

  const handleRegenerate = useCallback(() => {
    onRegenerate?.(message.id);
  }, [onRegenerate, message.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(message.id);
  }, [onEdit, message.id]);

  const handleRateUp = useCallback(() => {
    const newRating = message.rating === 'up' ? null : 'up';
    onRate?.(message.id, newRating);
  }, [onRate, message.id, message.rating]);

  const handleRateDown = useCallback(() => {
    const newRating = message.rating === 'down' ? null : 'down';
    onRate?.(message.id, newRating);
  }, [onRate, message.id, message.rating]);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-white dark:bg-zinc-900 p-0.5 shadow-sm">
        {/* Copy — available for both roles */}
        <ActionButton icon={Copy} label="Sao chép" onClick={handleCopy} />

        {/* User: Edit */}
        {isUser && onEdit && (
          <ActionButton icon={Pencil} label="Chỉnh sửa" onClick={handleEdit} />
        )}

        {/* Assistant: Regenerate (only last assistant message) */}
        {isAssistant && isLast && onRegenerate && (
          <ActionButton icon={RefreshCw} label="Tạo lại" onClick={handleRegenerate} />
        )}

        {/* Assistant: Rate */}
        {isAssistant && onRate && (
          <>
            <ActionButton
              icon={ThumbsUp}
              label="Hữu ích"
              onClick={handleRateUp}
              active={message.rating === 'up'}
              activeColor="text-green-600 dark:text-green-400"
            />
            <ActionButton
              icon={ThumbsDown}
              label="Không hữu ích"
              onClick={handleRateDown}
              active={message.rating === 'down'}
              activeColor="text-red-500 dark:text-red-400"
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export default memo(MessageActions);
