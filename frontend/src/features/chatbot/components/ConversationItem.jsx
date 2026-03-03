import { memo, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

// Rename state is fully managed by parent (ConversationDrawer)
const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onClick,
  onStartRename,
  onDelete,
  // rename props from parent
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onRenameSubmit(); }
    else if (e.key === 'Escape') { onRenameCancel(); }
  };

  return (
    <div
      onClick={() => !isRenaming && onClick(conversation.id)}
      className={`
        group relative cursor-pointer rounded-xl px-3 py-2.5 transition-colors
        ${isActive ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={onRenameSubmit}
                className="h-6 w-full rounded border border-primary bg-white dark:bg-zinc-800 px-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                maxLength={100}
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); onRenameSubmit(); }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-primary hover:bg-primary/10"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); onRenameCancel(); }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <p className="truncate text-sm font-medium text-foreground leading-tight">
                {conversation.title || 'Cuộc trò chuyện mới'}
              </p>
              {conversation.preview && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {conversation.preview}
                </p>
              )}
            </>
          )}
        </div>

        {!isRenaming && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                className="w-36"
                style={{ zIndex: 99999 }}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  onSelect={() => onStartRename(conversation.id, conversation.title || '')}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Đổi tên
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDelete(conversation.id, conversation.title || 'Cuộc trò chuyện này')}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
});

export default ConversationItem;
