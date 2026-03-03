import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, MessageSquarePlus, Trash2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import ConversationItem from './ConversationItem';

function groupConversations(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const groups = {
    'Hôm nay': [],
    'Hôm qua': [],
    'Tuần này': [],
    'Cũ hơn': []
  };

  for (const conv of conversations) {
    const date = new Date(conv.lastMessageAt || conv.startedAt);
    if (date >= today) {
      groups['Hôm nay'].push(conv);
    } else if (date >= yesterday) {
      groups['Hôm qua'].push(conv);
    } else if (date >= thisWeek) {
      groups['Tuần này'].push(conv);
    } else {
      groups['Cũ hơn'].push(conv);
    }
  }

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export default function ConversationDrawer({ isOpen, onClose }) {
  const {
    conversations,
    activeSessionId,
    switchConversation,
    renameConversation,
    deleteConversation,
    createConversation,
    isLoadingConversations
  } = useChat();

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const backdropRef = useRef(null);
  // Refs to guard against Radix pointer-event leaking into handleSwitchAndClose
  // after a DropdownMenuItem onSelect fires in the same event cycle
  const renameStartingRef = useRef(false);
  const renamingIdRef = useRef(null);
  const deleteStartingRef = useRef(false);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const query = search.toLowerCase();
    return conversations.filter(c =>
      (c.title || '').toLowerCase().includes(query) ||
      (c.preview || '').toLowerCase().includes(query)
    );
  }, [conversations, search]);

  // Group filtered conversations by date
  const grouped = useMemo(() => groupConversations(filteredConversations), [filteredConversations]);

  const handleSwitchAndClose = useCallback((sessionId) => {
    // Block if a rename/delete was just started (same event cycle) or rename is active
    if (renameStartingRef.current || renamingIdRef.current || deleteStartingRef.current) return;
    switchConversation(sessionId);
    onClose();
  }, [switchConversation, onClose]);

  const handleNewChat = useCallback(() => {
    createConversation();
    onClose();
  }, [createConversation, onClose]);

  const handleRequestDelete = useCallback((sessionId, title) => {
    deleteStartingRef.current = true;
    setDeleteTarget({ id: sessionId, title: title || 'Cuộc trò chuyện này' });
    setTimeout(() => { deleteStartingRef.current = false; }, 150);
  }, []);

  const handleStartRename = useCallback((id, title) => {
    // Set ref immediately (before React re-render) so handleSwitchAndClose
    // can see it in the same synchronous event cycle
    renameStartingRef.current = true;
    renamingIdRef.current = id;
    setRenamingId(id);
    setRenameValue(title);
    setTimeout(() => { renameStartingRef.current = false; }, 150);
  }, []);

  const handleSubmitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    const conv = conversations.find(c => c.id === renamingId);
    if (trimmed && trimmed !== (conv?.title || '')) {
      renameConversation(renamingId, trimmed);
    }
    renamingIdRef.current = null;
    setRenamingId(null);
  }, [renamingId, renameValue, conversations, renameConversation]);

  const handleCancelRename = useCallback(() => {
    renamingIdRef.current = null;
    setRenamingId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteConversation(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteConversation]);

  const handleCancelDelete = useCallback(() => setDeleteTarget(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (renamingId) setRenamingId(null);
        else if (deleteTarget) setDeleteTarget(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, deleteTarget, renamingId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 z-10 bg-black/60 animate-in fade-in duration-150"
      />

      {/* Drawer panel */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex w-[280px] flex-col border-r border-border bg-white dark:bg-zinc-950 shadow-xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white dark:bg-zinc-950 px-3">
          <h3 className="text-sm font-semibold text-foreground">Lịch sử trò chuyện</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Cuộc trò chuyện mới"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 px-2 pb-3">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện nào'}
              </p>
              {!search && (
                <button
                  onClick={handleNewChat}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Bắt đầu trò chuyện
                </button>
              )}
            </div>
          ) : (
            grouped.map(([label, items]) => (
              <div key={label} className="mt-2 first:mt-0">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeSessionId}
                      onClick={handleSwitchAndClose}
                      onStartRename={handleStartRename}
                      onDelete={handleRequestDelete}
                      isRenaming={conv.id === renamingId}
                      renameValue={renameValue}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={handleSubmitRename}
                      onRenameCancel={handleCancelRename}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirmation modal — rendered via portal to escape overflow-hidden */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancelDelete} />
          <div className="relative z-10 w-full max-w-[260px] rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Xóa cuộc trò chuyện?</h4>
            <p className="mt-1.5 text-xs text-muted-foreground">
              &ldquo;<span className="font-medium text-foreground">{deleteTarget.title}</span>&rdquo; sẽ bị xóa vĩnh viễn.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCancelDelete}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
