import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Plus, Search, Send } from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(dateString));
};

const getConversationName = (conversation) => {
  if (conversation?.title) return conversation.title;
  if (conversation?.other_participant?.full_name) return conversation.other_participant.full_name;
  return 'Hội thoại';
};

export function MessagingPage() {
  const { session, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const messageEndRef = useRef(null);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }), [session?.access_token]);

  const selectedConversation = useMemo(() => {
    return conversations.find((item) => item.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((item) => {
      const targetName = getConversationName(item).toLowerCase();
      const lastMessage = item.last_message?.content?.toLowerCase() || '';
      return targetName.includes(keyword) || lastMessage.includes(keyword);
    });
  }, [conversations, searchTerm]);

  const fetchConversations = useCallback(async () => {
    if (!session?.access_token) return;
    const response = await fetch(`${API_URL}/api/conversations`, { headers: authHeaders });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Không tải được danh sách hội thoại');
    }
    const nextConversations = (result.data || []).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    setConversations(nextConversations);
    if (!selectedConversationId && nextConversations.length > 0) {
      setSelectedConversationId(nextConversations[0].id);
    }
  }, [authHeaders, selectedConversationId, session?.access_token]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId || !session?.access_token) return;
    const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages?limit=100&offset=0`, {
      headers: authHeaders
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Không tải được tin nhắn');
    }
    setMessages(result.data || []);
  }, [authHeaders, session?.access_token]);

  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!conversationId || !session?.access_token) return;
    try {
      await fetch(`${API_URL}/api/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: authHeaders
      });
      setConversations((prev) => prev.map((item) => (
        item.id === conversationId ? { ...item, unread_count: 0 } : item
      )));
    } catch (_error) {
      // ignore read errors silently
    }
  }, [authHeaders, session?.access_token]);

  const fetchContacts = useCallback(async () => {
    if (!session?.access_token) return;
    const response = await fetch(`${API_URL}/api/users/contacts`, { headers: authHeaders });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Không tải được danh bạ');
    }
    setContacts(result.data || []);
  }, [authHeaders, session?.access_token]);

  const handleSelectConversation = useCallback(async (conversationId) => {
    setSelectedConversationId(conversationId);
    setMobileView('messages');
    try {
      await fetchMessages(conversationId);
      await markConversationAsRead(conversationId);
    } catch (error) {
      gooeyToast.error(error.message || 'Không thể mở hội thoại');
    }
  }, [fetchMessages, markConversationAsRead]);

  const handleSendMessage = useCallback(async () => {
    const content = messageText.trim();
    if (!selectedConversationId || !content || sending) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không gửi được tin nhắn');
      }
      setMessageText('');
      setMessages((prev) => [...prev, result.data]);
      setConversations((prev) => prev.map((conversation) => (
        conversation.id === selectedConversationId
          ? {
            ...conversation,
            updated_at: result.data.created_at,
            last_message: {
              id: result.data.id,
              sender_id: result.data.sender_id,
              content: result.data.content,
              created_at: result.data.created_at
            }
          }
          : conversation
      )).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
    } catch (error) {
      gooeyToast.error(error.message || 'Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  }, [authHeaders, messageText, selectedConversationId, sending]);

  const handleCreateConversation = useCallback(async () => {
    if (!selectedContactId) {
      gooeyToast.error('Vui lòng chọn một liên hệ');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ participant_ids: [selectedContactId] })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không tạo được hội thoại mới');
      }

      setIsNewConversationOpen(false);
      setSelectedContactId('');
      await fetchConversations();
      if (result.data?.id) {
        await handleSelectConversation(result.data.id);
      }
    } catch (error) {
      gooeyToast.error(error.message || 'Tạo hội thoại thất bại');
    }
  }, [authHeaders, fetchConversations, handleSelectConversation, selectedContactId]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!session?.access_token) return;
      setLoading(true);
      try {
        await Promise.all([fetchConversations(), fetchContacts()]);
      } catch (error) {
        gooeyToast.error(error.message || 'Không thể tải trang tin nhắn');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [fetchContacts, fetchConversations, session?.access_token]);

  useEffect(() => {
    if (!selectedConversationId) return;
    fetchMessages(selectedConversationId).catch((error) => {
      gooeyToast.error(error.message || 'Không tải được tin nhắn');
    });
    markConversationAsRead(selectedConversationId);
  }, [fetchMessages, markConversationAsRead, selectedConversationId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!session?.access_token) return undefined;

    const channel = supabase
      .channel(`messages-page-${user?.id || 'unknown'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const incomingConversationId = payload.new?.conversation_id;
        if (!incomingConversationId) return;

        if (incomingConversationId === selectedConversationId) {
          await fetchMessages(incomingConversationId);
          await markConversationAsRead(incomingConversationId);
        }

        await fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, fetchMessages, markConversationAsRead, selectedConversationId, session?.access_token, user?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-muted-foreground">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] overflow-hidden rounded-xl border bg-white">
      <div className="grid h-full grid-cols-1 md:grid-cols-[340px_1fr]">
        <div className={`${mobileView === 'messages' ? 'hidden md:block' : 'block'} border-r`}>
          <div className="space-y-3 border-b p-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg font-semibold">Tin nhắn</h1>
              <Button size="sm" onClick={() => setIsNewConversationOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Tin nhắn mới
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
                placeholder="Tìm hội thoại..."
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-18rem)]">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Chưa có hội thoại nào</div>
            ) : filteredConversations.map((conversation) => {
              const active = conversation.id === selectedConversationId;
              const displayName = getConversationName(conversation);
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`flex w-full items-start gap-3 border-b p-4 text-left transition-colors ${active ? 'bg-blue-50' : 'hover:bg-muted/40'}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.other_participant?.avatar_url || ''} alt={displayName} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-slate-900">{displayName}</p>
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {conversation.last_message?.content || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        </div>

        <div className={`${mobileView === 'messages' ? 'flex' : 'hidden md:flex'} min-h-0 flex-col`}>
          {selectedConversation ? (
            <>
              <div className="flex items-center gap-3 border-b p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileView('list')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={selectedConversation.other_participant?.avatar_url || ''}
                    alt={getConversationName(selectedConversation)}
                  />
                  <AvatarFallback>{getInitials(getConversationName(selectedConversation))}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{getConversationName(selectedConversation)}</p>
                  <p className="text-xs text-muted-foreground">Hội thoại nội bộ</p>
                </div>
              </div>

              <ScrollArea className="flex-1 bg-slate-50/30 p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Bắt đầu cuộc trò chuyện ngay nhé</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const mine = message.sender_id === user?.id;
                      const senderName = message.sender?.full_name || 'Người dùng';
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-2 ${mine ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-900'}`}>
                            {!mine && <p className="mb-1 text-xs font-semibold">{senderName}</p>}
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            <p className={`mt-1 text-right text-[11px] ${mine ? 'text-blue-100' : 'text-slate-500'}`}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messageEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="border-t p-3">
                <div className="flex items-end gap-2">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!messageText.trim() || sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <MessageSquare className="mb-3 h-12 w-12 opacity-40" />
              <p>Chọn một hội thoại để bắt đầu</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tin nhắn mới</DialogTitle>
            <DialogDescription>Chọn liên hệ để bắt đầu cuộc trò chuyện</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[360px] space-y-2 pr-1">
            {contacts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Không có liên hệ nào khả dụng</p>
            ) : contacts.map((contact) => {
              const selected = selectedContactId === contact.id;
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted/50'}`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={contact.avatar_url || ''} alt={contact.name} />
                    <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.role || 'Thành viên'}</p>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateConversation} disabled={!selectedContactId}>Bắt đầu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MessagingPage;
