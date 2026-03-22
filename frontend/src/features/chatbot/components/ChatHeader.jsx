import { GraduationCap, Minus, X, PanelLeftOpen, Plus } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function ChatHeader({ onToggleDrawer }) {
  const { minimize, close, mode, createConversation } = useChat();
  const isStudent = mode === 'student';

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white dark:bg-zinc-950 px-4">
      <div className="flex items-center gap-2">
        {isStudent && (
          <button
            onClick={onToggleDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Lịch sử trò chuyện"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">Molly</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isStudent && (
          <button
            onClick={createConversation}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cuộc trò chuyện mới"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={minimize}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Thu nhỏ"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
